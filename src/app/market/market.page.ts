import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonToolbar, CommonModule, FormsModule]
})
export class MarketPage implements OnInit {

  constructor(private http: HttpClient, private router: Router) { }
  public itemsMarket: any[] = [];
  public isLoading = false;
  public infoUser: any;
  host_url = 'http://localhost:3000';

  ngOnInit() {
    this.loadUserInfo();
    this.getItemsMarket();
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
        console.error('Error al cargar info del usuario:', error);
      }
    });
  }

  getItemsMarket() {
    this.isLoading = true;
    this.http.get(`${this.host_url}/market/items`).subscribe({
      next: (response: any) => {
        this.itemsMarket = response.items || [];
        console.log('Items en el market:', this.itemsMarket);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar items del market:', error);
        this.itemsMarket = [];
        this.isLoading = false;
      }
    });
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }

}
