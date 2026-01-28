import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar, IonButton, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel, AlertController } from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-item-shop',
  templateUrl: './item-shop.page.html',
  styleUrls: ['./item-shop.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonToolbar, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel, CommonModule, FormsModule, RouterModule]
})
export class ItemShopPage implements OnInit {
  public isLoading = false;
  public items: any[] = [];
  lastUpdate = '';
  host_url = 'http://localhost:3000';
  public infoUser: any;
  public characters: any[] = [];
  public selectedItem: any = null;
  public showCharacterModal = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.checkAndLoadItems();
  }

  loadUserInfo() {
    this.isLoading = true;
    const userString = localStorage.getItem('user');
    if (!userString) {
      console.error('Usuario no encontrado en localStorage');
      this.isLoading = false;
      return;
    }

    const user = JSON.parse(userString);
    this.http.get(this.host_url + `/users/${user.email}`).subscribe({
      next: (data: any) => {
        this.infoUser = data.user;
        console.log('Información del usuario obtenida:', this.infoUser);
        this.loadCharacters();
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.isLoading = false;
      }
    });
  }

  loadCharacters() {
    if (!this.infoUser || !this.infoUser.id) {
      console.error('No hay información del usuario para cargar personajes');
      return;
    }

    this.http.get(this.host_url + `/characters/user/${this.infoUser.id}`).subscribe({
      next: (data: any) => {
        this.characters = data.characters || data;
        console.log('Personajes del usuario:', this.characters);
      },
      error: (error) => {
        console.error('Error al obtener personajes:', error);
        this.characters = [];
      }
    });
  }

  checkAndLoadItems() {
    const savedDate = localStorage.getItem('itemShopDate');
    const savedItems = localStorage.getItem('itemShopItems');
    const today = new Date().toISOString().slice(0, 10);

    if (savedDate && savedItems && savedDate === today) {
      console.log('Usando items del caché (fecha: ' + savedDate + ')');
      this.items = JSON.parse(savedItems);
      this.lastUpdate = savedDate;
      this.checkLoadingComplete();
    } else {
      if (!savedDate) {
        console.log('No hay caché, obteniendo items del servidor');
      } else {
        console.log('Fecha diferente (guardada: ' + savedDate + ', hoy: ' + today + '), actualizando items');
      }
      this.getItemsFromServer();
    }
  }

  getItemsFromServer() {
    this.http.get(this.host_url + '/item-shop').subscribe({
      next: (data: any) => {
        this.items = data.items;
        this.lastUpdate = data.date;

        localStorage.setItem('itemShopDate', data.date);
        localStorage.setItem('itemShopItems', JSON.stringify(this.items));

        console.log('Items actualizados desde el servidor (fecha: ' + data.date + ')');
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error al obtener items:', error);
        this.isLoading = false;
      }
    });
  }

  checkLoadingComplete() {
    if (this.items.length >= 0 && this.infoUser) {
      this.isLoading = false;
    }
  }

  refreshUserInfo() {
    // Actualizar usuario sin activar el loading
    const userString = localStorage.getItem('user');
    if (!userString) {
      console.error('Usuario no encontrado en localStorage');
      return;
    }

    const user = JSON.parse(userString);
    this.http.get(this.host_url + `/users/${user.email}`).subscribe({
      next: (data: any) => {
        this.infoUser = data.user;
        console.log('Información del usuario actualizada:', this.infoUser);
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
      }
    });
  }

  buyItem(item: any) {
    if (!this.infoUser) {
      console.error('No hay información del usuario');
      alert('Error: no se encontró información del usuario');
      return;
    }

    if (!this.characters || this.characters.length === 0) {
      alert('No tienes personajes. Crea uno primero desde el menú de personajes.');
      return;
    }

    this.selectedItem = item;
    this.showCharacterModal = true;
  }

  async selectCharacter(character: any) {
    if (!this.selectedItem || !this.infoUser) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar compra',
      message: `¿Asignar ${this.selectedItem.name} a ${character.name}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Sí',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.processPurchase(character);
          }
        }
      ]
    });

    await alert.present();
  }

  async processPurchase(character: any) {
    this.showCharacterModal = false;

    const purchaseData = {
      userId: this.infoUser.id,
      itemId: this.selectedItem.id,
      characterId: character.id
    };

    const itemName = this.selectedItem.name;
    this.selectedItem = null;

    console.log('Procesando compra para personaje:', character.name);

    this.http.post(this.host_url + '/item-shop/', purchaseData).subscribe({
      next: async (response: any) => {
        console.log('Compra exitosa:', response);

        const successAlert = await this.alertController.create({
          header: '¡Compra exitosa!',
          message: `Has comprado ${itemName} para ${character.name}`,
          buttons: [{
            text: 'OK',
            handler: () => {
              window.location.reload();
            }
          }],
          cssClass: 'success-alert'
        });
        await successAlert.present();
      },
      error: async (error) => {
        console.error('Error al comprar:', error);

        let errorMessage = 'Error al realizar la compra';
        if (error.status === 400) {
          errorMessage = error.error.message || 'No tienes suficiente oro o faltan parámetros';
        } else if (error.status === 404) {
          errorMessage = error.error.message || 'Usuario, personaje o ítem no encontrado';
        }

        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK'],
          cssClass: 'error-alert'
        });
        await errorAlert.present();
      }
    });
  }

  cancelPurchase() {
    this.showCharacterModal = false;
    this.selectedItem = null;
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }
}
