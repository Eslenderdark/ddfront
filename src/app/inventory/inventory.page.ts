import { Component, OnInit, signal, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';


@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule
  ],
  styleUrls: ['./inventory.page.scss']
})
export class InventoryPage implements OnInit {

  characters: any[] = [];
  items: any[] = [];
  infoUser: any = null;
  public url_host = 'http://localhost:3000';
  public user_email: string = "";
  public isLoading = false;
  public selectedItem: any = null;
  public showTransferModal = false;
  public availableCharacters: any[] = [];


  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) { }


  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.user_email = user.email;
    }
    this.loadInventory();
  }

  ionViewWillEnter() {
    this.loadInventory();
  }


  loadInventory() {
    this.isLoading = true;

    if (!this.user_email) {
      this.isLoading = false;
      return;
    }

    this.http.get(this.url_host + `/users/${this.user_email}`).subscribe({
      next: (data: any) => {
        this.infoUser = data.user;
        console.log('Información del usuario obtenida:', this.infoUser);
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.isLoading = false;
      }
    });

    this.http.get<any>(`${this.url_host}/getcharactersbyemail/${this.user_email}`)
      .subscribe({
        next: (res) => {
          console.log('BACK RESPONSE:', res);
          this.characters = res.characters;
          this.items = res.items;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar inventario:', error);
          this.isLoading = false;
        }
      });
  }


  getSellPrice(r: string) {
    return r == 'común' ? 50 :
      r == 'raro' ? 150 :
        r == 'épico' ? 400 :
          r == 'legendario' ? 1000 : 20;
  }


  assignItem(i: any, c: number) {
    this.http.post(`${this.url_host}/inventory/assign`, { itemId: i.id, characterId: c })
      .subscribe();
  }


  sellItem(i: any) {
    const p = this.getSellPrice(i.rareza);
    this.http.post(`${this.url_host}/inventory/sell`, { itemId: i.id, price: p })
      .subscribe(() => this.items = this.items.filter(x => x.id !== i.id));
  }


  async publishMarket(item: any) {
    const alert = await this.alertController.create({
      header: 'Vender en Market',
      message: `Precio base: ${item.price} monedas. ¿A qué precio quieres venderlo?`,
      cssClass: 'custom-alert market-alert',
      inputs: [
        {
          name: 'marketPrice',
          type: 'number',
          placeholder: `Mínimo ${item.price}`,
          min: item.price,
          value: item.price,
          attributes: {
            inputmode: 'numeric'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Publicar',
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            const price = parseInt(data.marketPrice);

            if (!price || price < item.price) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: `El precio debe ser al menos ${item.price} monedas`,
                cssClass: 'custom-alert error-alert',
                buttons: [
                  {
                    text: 'OK',
                    cssClass: 'alert-button-confirm'
                  }
                ]
              });
              await errorAlert.present();
              return false;
            }

            this.http.post(`${this.url_host}/market/add`, {
              itemId: item.id,
              price: price,
              sellerId: this.user_email
            }).subscribe({
              next: async () => {
                this.items = this.items.filter(x => x.id !== item.id);
                const successAlert = await this.alertController.create({
                  header: '¡Publicado!',
                  message: `Tu item ${item.name} está ahora en el market por ${price} monedas`,
                  cssClass: 'custom-alert success-alert',
                  buttons: [
                    {
                      text: 'OK',
                      cssClass: 'alert-button-confirm'
                    }
                  ]
                });
                await successAlert.present();
              },
              error: async (err) => {
                console.error('Error publicando en market:', err);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: err.error?.error || 'No se pudo publicar el item',
                  cssClass: 'custom-alert error-alert',
                  buttons: [
                    {
                      text: 'OK',
                      cssClass: 'alert-button-confirm'
                    }
                  ]
                });
                await errorAlert.present();
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }






  getItemsByCharacter(characterId: number) {
    return this.items.filter(item => item.character_id === characterId);
  }

  async removeFromMarket(item: any) {
    const alert = await this.alertController.create({
      header: 'Retirar del Market',
      message: `¿Quieres retirar ${item.name} del mercado?`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Retirar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.http.post(`${this.url_host}/market/removeitem`, {
              itemId: item.id,
              sellerId: this.infoUser.id
            })
              .subscribe({
                next: async (res) => {
                  console.log('Item retirado del market:', res);
                  const successAlert = await this.alertController.create({
                    header: '¡Retirado!',
                    message: `${item.name} ha sido retirado del mercado`,
                    cssClass: 'custom-alert success-alert',
                    buttons: [
                      {
                        text: 'OK',
                        cssClass: 'alert-button-confirm'
                      }
                    ]
                  });
                  await successAlert.present();
                  this.loadInventory();
                },
                error: async (err) => {
                  console.error('Error retirando del market:', err);
                  const errorAlert = await this.alertController.create({
                    header: 'Error',
                    message: err.error?.message || 'No se pudo retirar el item del mercado',
                    cssClass: 'custom-alert error-alert',
                    buttons: [
                      {
                        text: 'OK',
                        cssClass: 'alert-button-confirm'
                      }
                    ]
                  });
                  await errorAlert.present();
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  transferItem(item: any) {
    this.selectedItem = item;
    this.availableCharacters = this.characters.filter(c => c.id !== item.character_id);
    this.showTransferModal = true;
  }

  async selectCharacterForTransfer(character: any) {
    if (!this.selectedItem || !this.infoUser) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar transferencia',
      message: `¿Transferir ${this.selectedItem.name} a ${character.name}?`,
      cssClass: 'custom-alert',
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
            this.processTransfer(character);
          }
        }
      ]
    });

    await alert.present();
  }

  async processTransfer(character: any) {
    this.showTransferModal = false;

    try {
      await this.http.post(`${this.url_host}/changeitem`, {
        itemId: this.selectedItem.id,
        fromCharacterId: this.selectedItem.character_id,
        toCharacterId: character.id,
        userId: this.infoUser.id
      }).toPromise();

      console.log('Item transferido exitosamente');

      this.selectedItem = null;

      const successAlert = await this.alertController.create({
        header: '¡Transferido!',
        message: `El item ha sido transferido a ${character.name}`,
        cssClass: 'custom-alert success-alert',
        buttons: [
          {
            text: 'OK',
            cssClass: 'alert-button-confirm'
          }
        ]
      });

      await successAlert.present();
      await successAlert.onDidDismiss();
      window.location.reload();
    } catch (error: any) {
      console.error('Error transfiriendo item:', error);
      this.selectedItem = null;

      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: error.error?.message || 'No se pudo transferir el item',
        cssClass: 'custom-alert error-alert',
        buttons: [
          {
            text: 'OK',
            cssClass: 'alert-button-confirm'
          }
        ]
      });
      await errorAlert.present();
    }
  }

  cancelTransfer() {
    this.showTransferModal = false;
    this.selectedItem = null;
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }
  async venderitem(itemId: number) {
    const alert = await this.alertController.create({
      header: 'Venta Rápida',
      message: '¿Estás seguro de que quieres vender este item al precio base?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Vender',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.http.get<any>(`${this.url_host}/sellitem/${itemId}`)
              .subscribe({
                next: async (res) => {
                  console.log('Item vendido:', res);
                  const successAlert = await this.alertController.create({
                    header: '¡Vendido!',
                    message: 'El item se ha vendido correctamente al precio base',
                    cssClass: 'custom-alert success-alert',
                    buttons: [
                      {
                        text: 'OK',
                        cssClass: 'alert-button-confirm'
                      }
                    ]
                  });
                  await successAlert.present();
                  this.loadInventory();
                },
                error: async (err) => {
                  console.error('Error vendiendo item:', err);
                  const errorAlert = await this.alertController.create({
                    header: 'Error',
                    message: 'No se pudo vender el item',
                    cssClass: 'custom-alert error-alert',
                    buttons: [
                      {
                        text: 'OK',
                        cssClass: 'alert-button-confirm'
                      }
                    ]
                  });
                  await errorAlert.present();
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }
}