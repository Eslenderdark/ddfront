import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar, IonIcon, IonSpinner, IonButton, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel, AlertController } from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-item-shop',
  templateUrl: './item-shop.page.html',
  styleUrls: ['./item-shop.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonToolbar, IonSpinner, IonIcon, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel, CommonModule, FormsModule, RouterModule]
})
export class ItemShopPage implements OnInit {
  public isGenerating: boolean = false;
  public isLoading = false;
  public items: any[] = [];
  lastUpdate = '';
  host_url = 'http://localhost:3000';
  public infoUser: any;
  public characters: any[] = [];
  public selectedItem: any = null;
  public showCharacterModal = false;
  public newItemGained: any = null;
  public showRewardModal = false;

  public eligibleCharacters: any[] = [];
  get eligibleAliveCharacters() {
    return this.eligibleCharacters?.filter(c => c.alive);
  }

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

    this.eligibleCharacters = [...this.characters];
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
  async presentErrorAlert(msg: string) {
    const alert = await this.alertController.create({
      header: 'Nivel Insuficiente',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }
  async processPurchase(character: any) {

    if (this.selectedItem.isBox) {
      if (this.selectedItem.tier === 'Hierro' && character.xp < 500) {
        this.presentErrorAlert('Este personaje necesita 500 XP para abrir cofres de Hierro.');
        return;
      }
      if (this.selectedItem.tier === 'Esmeralda' && character.xp < 1000) {
        this.presentErrorAlert('Este personaje necesita 1000 XP para abrir cofres de Esmeralda.');
        return;
      }
    }
    this.showCharacterModal = false;
    this.isGenerating = true;

    const purchaseData: any = {
      userId: this.infoUser.id,
      characterId: character.id
    };

    if (this.selectedItem.isBox) {
      purchaseData.price = this.selectedItem.price;
      purchaseData.tier = this.selectedItem.tier;
      purchaseData.boxType = this.selectedItem.boxType;
      purchaseData.isBox = true;
    } else {
      purchaseData.itemId = this.selectedItem.id;
    }

    this.http.post(this.host_url + '/item-shop', purchaseData).subscribe({
      next: async (response: any) => {
        this.newItemGained = response.item;
        this.refreshUserInfo();

        this.isGenerating = false;
        this.showRewardModal = true;
      },
      error: async (error) => {
        this.isGenerating = false;
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: error.error?.message || 'Error en la comunicación',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    });
  }

  closeRewardModal() {
    this.showRewardModal = false;
    this.newItemGained = null;
  }

  cancelPurchase() {
    this.showCharacterModal = false;
    this.selectedItem = null;
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }

  buyBox(type: string, tier: string) {
    if (!this.infoUser) {
      alert('Error: no se encontró información del usuario');
      return;
    }

    if (!this.characters || this.characters.length === 0) {
      alert('No tienes personajes disponibles.');
      return;
    }

    let price = 0;
    let requiredXP = 0;
    if (tier === 'Madera') { price = 35; requiredXP = 0; }
    else if (tier === 'Hierro') { price = 75; requiredXP = 500; }
    else if (tier === 'Esmeralda') { price = 125; requiredXP = 1000; }

    this.eligibleCharacters = this.characters.filter(char => (char.xp ?? 0) >= requiredXP);

    if (this.eligibleCharacters.length === 0) {
      alert('Ningún personaje cumple el requisito de XP para este cofre.');
      return;
    }

    this.selectedItem = {
      name: `Caja de ${type} de ${tier}`,
      price: price,
      tier: tier,
      boxType: type,
      isBox: true
    };

    this.showCharacterModal = true;
  }

  canBuyBox(tier: string): boolean {
    if (!this.infoUser || !this.characters || this.characters.length === 0) return false;
    let price = 0;
    let requiredXP = 0;
    if (tier === 'Madera') { price = 35; requiredXP = 0; }
    else if (tier === 'Hierro') { price = 75; requiredXP = 500; }
    else if (tier === 'Esmeralda') { price = 125; requiredXP = 1000; }
    if ((this.infoUser.coins ?? 0) < price) return false;
    if (requiredXP === 0) return true;
    return this.characters.some(char => (char.xp ?? 0) >= requiredXP);
  }


}
