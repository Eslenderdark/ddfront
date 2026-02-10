import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar, IonButton, AlertController, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonToolbar, CommonModule, FormsModule, IonModal, IonHeader, IonTitle, IonList, IonItem, IonLabel]
})
export class MarketPage implements OnInit {

  constructor(private http: HttpClient, private router: Router, private alertController: AlertController) { }
  public itemsMarket: any[] = [];
  public isLoading = false;
  public infoUser: any;
  host_url = 'http://localhost:3000';
  public selectedItem: any = null;
  public characters: any[] = [];
  public showCharacterModal = false;

  get aliveCharacters() {
    return this.characters?.filter(c => c.alive);
  }

  async ngOnInit() {
    this.isLoading = true;
    await this.loadUserInfo();
    await this.getItemsMarket();
    this.isLoading = false;
  }

  async loadUserInfo() {
    const userString = localStorage.getItem('user');
    if (!userString) {
      console.error('Usuario no encontrado en localStorage');
      return;
    }
    const user = JSON.parse(userString);

    try {
      const data: any = await this.http.get(this.host_url + `/users/${user.email}`).toPromise();
      this.infoUser = data.user;
      console.log('Información del usuario obtenida:', this.infoUser);
      await this.loadCharacters();
    } catch (error) {
      console.error('Error al cargar info del usuario:', error);
    }
  }

  async loadCharacters() {
    if (!this.infoUser || !this.infoUser.id) {
      console.error('No hay información del usuario para cargar personajes');
      return;
    }
    try {
      const data: any = await this.http.get(this.host_url + `/characters/user/${this.infoUser.id}`).toPromise();
      this.characters = data.characters || data;
      console.log('Personajes del usuario:', this.characters);
    } catch (error) {
      console.error('Error al obtener personajes:', error);
      this.characters = [];
    }
  }

  async getItemsMarket() {
    try {
      const response: any = await this.http.get(`${this.host_url}/market/items`).toPromise();
      this.itemsMarket = response.items || [];
      console.log('Items en el market:', this.itemsMarket);
    } catch (error) {
      console.error('Error al cargar items del market:', error);
      this.itemsMarket = [];
    }
  }

  async buyItemMarket(item: any) {
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


  // showCharacterSelectModal ya no se usa, el modal se controla por showCharacterModal
  cancelPurchase() {
    this.showCharacterModal = false;
    this.selectedItem = null;
  }

  async confirmBuyItem(character: any) {
    this.isLoading = true;
    this.showCharacterModal = false;
    // Guardar nombres antes de limpiar selectedItem
    const itemName = this.selectedItem?.name;
    const characterName = character?.name;
    try {

      const res: any = await this.http.post(`${this.host_url}/market/buyitem`, {
        itemId: this.selectedItem.id,
        buyerId: this.infoUser.id,
        characterId: character.id
      }).toPromise();

      console.log('Respuesta de compra:', res);

      const doneAlert = await this.alertController.create({
        header: '¡Compra exitosa!',
        message: `Has asignado ${itemName} a ${characterName}.`,
        buttons: [{
          text: 'OK',
          handler: () => {
            window.location.reload();
          }
        }],
        cssClass: 'success-alert'
      });

      await doneAlert.present();
    } catch (error: any) {

      console.error('Error al comprar item:', error);
      let errorMessage = 'No se pudo completar la compra.';

      if (error?.status === 400) {
        errorMessage = error.error?.message || 'No tienes suficiente oro o faltan parámetros';
      } else if (error?.status === 404) {
        errorMessage = error.error?.message || 'Usuario, personaje o ítem no encontrado';
      }

      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK'],
        cssClass: 'error-alert'
      });

      await errorAlert.present();
    }

    this.isLoading = false;
    this.selectedItem = null;
  }



  async removeFromMarket(item: any) {
    const alert = await this.alertController.create({
      header: 'Retirar del Market',
      message: `¿Quieres retirar ${item.name} del mercado?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Retirar',
          cssClass: 'alert-button-confirm',
          handler: async () => {
            this.isLoading = true;
            try {
              await this.http.post(`${this.host_url}/market/removeitem`, {
                itemId: item.id,
                sellerId: this.infoUser.id
              }).toPromise();

              const successAlert = await this.alertController.create({
                header: '¡Retirado!',
                message: `${item.name} ha sido retirado del mercado`,
                buttons: [{ text: 'OK' }],
                cssClass: 'success-alert'
              });
              await successAlert.present();

              await this.getItemsMarket();
              this.isLoading = false;
            } catch (error: any) {
              console.error('Error retirando item:', error);
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: error.error?.message || 'No se pudo retirar el item del mercado',
                buttons: ['OK'],
                cssClass: 'error-alert'
              });
              await errorAlert.present();
              this.isLoading = false;
            }
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }

}
