import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-item-shop',
  templateUrl: './item-shop.page.html',
  styleUrls: ['./item-shop.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonToolbar, CommonModule, FormsModule, RouterModule]
})
export class ItemShopPage implements OnInit {
  public isLoading = false;
  public items: any[] = [];
  lastUpdate = '';
  host_url = 'http://localhost:3000';
  public infoUser: any;
  constructor(private router: Router, private http: HttpClient) { }
  //Date().toISOString().slice(0, 10);
  ngOnInit() {
    this.loadUserInfo();
    this.checkAndLoadItems();
  }

  loadUserInfo() {
    const userString = localStorage.getItem('user');
    if (!userString) {
      console.error('Usuario no encontrado en localStorage');
      return;
    }

    const user = JSON.parse(userString);
    this.http.get(this.host_url + `/users/${user.email}`).subscribe({
      next: (data: any) => {
        this.infoUser = data.user;
        console.log('Información del usuario obtenida:', this.infoUser);
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
      }
    });
  }

  checkAndLoadItems() {
    this.isLoading = true;

    const savedDate = localStorage.getItem('itemShopDate');
    const savedItems = localStorage.getItem('itemShopItems');
    const today = new Date().toISOString().slice(0, 10);

    if (savedDate && savedItems && savedDate === today) {
      console.log('Usando items del caché (fecha: ' + savedDate + ')');
      this.items = JSON.parse(savedItems);
      this.lastUpdate = savedDate;
      this.isLoading = false;
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener items:', error);
        this.isLoading = false;
      }
    });
  }

  buyItem(item: any) {
    if (!this.infoUser) {
      console.error('No hay información del usuario');
      return;
    }
    
    const purchaseData = {
      userId: this.infoUser.id,
      itemId: item.id,
    };

    console.log('Comprando item:', item.name);
    
    this.http.post(this.host_url + '/item-shop/', purchaseData).subscribe({
      next: (response: any) => {
        console.log('Compra exitosa:', response);
        this.loadUserInfo();
        alert(`¡Has comprado ${item.name}!`);
      },
      error: (error) => {
        console.error('Error al comprar:', error);
        if (error.status === 400) {
          alert(error.error.message || 'Faltan parámetros, no hay monedas suficientes, o inventario lleno');
        } else if (error.status === 404) {
          alert(error.error.message || 'Usuario o ítem no encontrado');
        } else {
          alert('Error al realizar la compra');
        }
      }
    });
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }
}
