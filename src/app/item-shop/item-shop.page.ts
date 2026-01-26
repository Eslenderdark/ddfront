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
  public lastUpdate: Date = new Date();
  host_url = 'http://localhost:3000';
  public infoUser: any;
  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit() {
    this.getItemsDaily();
  }

  getItemsDaily() {
    this.isLoading = true;
    this.http.get(this.host_url + '/item-shop').subscribe((data: any) => {
      this.items = data.items;
      this.lastUpdate = new Date();
      console.log(this.items);
      const userString = localStorage.getItem('user');
      if (!userString) {
        console.error('Usuario no encontrado en localStorage');
        return;
      }

      const user = JSON.parse(userString);
      this.http.get(this.host_url + `/users/${user.email}`).subscribe((data: any) => {
        this.infoUser = data.user;
        console.log('Información del usuario obtenida:', this.infoUser);
        this.isLoading = false;

      });

    });
  }

  buyItem(item: any) {
    console.log('Comprando item:', item);
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }
}
