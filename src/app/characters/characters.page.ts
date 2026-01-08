import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonGrid, IonRow, IonCol,
  IonCard, IonCardContent,
  IonIcon, IonButton,
  IonModal, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonRange, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

addIcons({ addCircleOutline });

@Component({
  selector: 'app-characters',
  templateUrl: './characters.page.html',
  styleUrls: ['./characters.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonGrid, IonRow, IonCol,
    IonCard, IonCardContent,
    IonIcon, IonButton,
    IonModal, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonRange, IonButtons
  ]
})
export class CharactersPage implements OnInit {

  isCreateModalOpen = false;

  newCharacter = {
    name: '',
    race: '',
    stats: {
      strength: 5,
      agility: 5,
      health: 100
    }
  };

  constructor() {
      addIcons({addCircleOutline});}

  ngOnInit() {}

  movePage() {
    console.log('Moving to page');
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  createCharacter() {
    if (!this.newCharacter.name || !this.newCharacter.race) {
      console.log('Fill all fields');
      return;
    }

    console.log('Character created:', this.newCharacter);

    // Aquí luego puedes guardarlo en un array o backend

    this.closeCreateModal();
  }
}
