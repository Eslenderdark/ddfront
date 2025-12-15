import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonCol, IonRow } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start-menu',
  templateUrl: './start-menu.page.html',
  styleUrls: ['./start-menu.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonGrid, IonCol, IonRow]
})
export class StartMenuPage implements OnInit {

  constructor(private route: Router) { }

  ngOnInit() {

  }

  async movePage() { // Funcion para movernos a la pagina de juego
    console.log('Moving to page: ');
    this.route.navigate(['/game']);
  }
}
