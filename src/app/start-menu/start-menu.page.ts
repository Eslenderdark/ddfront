import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonCol, IonRow, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-start-menu',
  templateUrl: './start-menu.page.html',
  styleUrls: ['./start-menu.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonCol, IonRow, IonButton]
})
export class StartMenuPage implements OnInit {

  public user: any;
  public host_url: string = 'http://localhost:3000';
  public isLogged = false;

  constructor(
    @Inject(DOCUMENT) public document: Document,
    private route: Router,
    private auth: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.auth.user$.subscribe((data) => {
      this.user = data;
      this.isLogged = !!data?.email;
      console.log('Logged:', this.isLogged);

      if (!data?.email) {
        console.log('No hay email, no se envía al backend');
        return;
      }

      const payload = {
        id: data.email,
        name: data.name,
        coins: 0
      };


      this.http.post(`${this.host_url}/users`, payload).subscribe({
        next: (res: any) => {
          console.log('User guardado:', res);
          localStorage.setItem('user', JSON.stringify(this.user));
        },
        error: (err) => {
          console.error('Error guardando user:', err);
          console.error('URL intentada:', `${this.host_url}/users`);
        }
      });
    });
  }

 goTo(page: string) {
    console.log('Moving to:', page);
    this.route.navigate(['/' + page]);
  }

  login() {
    this.auth.loginWithRedirect({
      appState: {
        target: '/start-menu',
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.auth.logout({
      logoutParams: {
        returnTo: this.document.location.origin
      }
    });
  }
}
