import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar,IonGrid,IonRow,IonCol,IonCard,IonCardContent,IonIcon,IonButton} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, addCircleOutline, heart } from 'ionicons/icons';

addIcons({
  add,
  addCircleOutline,
  heart
});

@Component({
  selector: 'app-characters',
  templateUrl: './characters.page.html',
  styleUrls: ['./characters.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonGrid,IonRow,IonCol,IonCard,IonCardContent,IonIcon,IonButton]
})
export class CharactersPage implements OnInit {
  route: any;

  
  constructor() {
      addIcons({addCircleOutline}); }

  ngOnInit() {
  }

  async movePage() {
    console.log('Moving to page: ');
    this.route.navigate(['/start-menu']);
  }

}
