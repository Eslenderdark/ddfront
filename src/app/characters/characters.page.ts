import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonGrid, IonRow, IonCol,
  IonCard, IonCardContent,
  IonIcon, IonButton,
  IonModal, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonRange, IonButtons, IonCardHeader, IonCardTitle, IonCardSubtitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';

addIcons({ addCircleOutline });

interface CharacterPayload {
  id?: number;
  name: string;
  hp: number;
  strength: number;
  agility: number;
  luck: number;
  alive: boolean;
  run: boolean;
  state: any;
  user_id: string;
  xp: number;
}

@Component({
  selector: 'app-characters',
  templateUrl: './characters.page.html',
  styleUrls: ['./characters.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonGrid, IonRow, IonCol,
    IonCard, IonCardContent,
    IonIcon, IonButton,
    IonModal, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonRange, IonButtons, IonCardHeader, IonCardTitle, IonCardSubtitle
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

  characters: CharacterPayload[] = [];
  host_url = 'http://localhost:3000';
  userId = '';

  constructor(private http: HttpClient, private router: Router) {
    addIcons({ addCircleOutline });
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userId = user.email || '';
    this.loadCharacters();
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

    const payload: CharacterPayload = {
      name: this.newCharacter.name,
      hp: this.newCharacter.stats.health,
      strength: this.newCharacter.stats.strength,
      agility: this.newCharacter.stats.agility,
      luck: 1,
      alive: true,
      run: false,
      state: {
        race: this.newCharacter.race
      },
      user_id: this.userId,
      xp: 0
    };

    this.http.post<{ message: string; character: CharacterPayload }>(
      `${this.host_url}/characters`,
      payload
    ).subscribe({
      next: (res) => {
        // El backend DEBE devolver el personaje con id real
        console.log('Personaje creado con id:', res.character.id);
        this.characters.push(res.character);
        this.closeCreateModal();
        this.resetNewCharacterForm();
      },
      error: (err) => {
        console.error('Error creating character:', err);
      }
    });
  }

  private resetNewCharacterForm() {
    this.newCharacter = {
      name: '',
      race: '',
      stats: {
        strength: 5,
        agility: 5,
        health: 100
      }
    };
  }


  loadCharacters() {
    if (!this.userId) return;

    this.http.get<{ characters: CharacterPayload[] }>(`${this.host_url}/characters/user/${this.userId}`)
      .subscribe({
        next: (res) => {
          this.characters = res.characters;
        },
        error: (err) => {
          console.error('Error loading characters', err);
        }
      });
  }

 startGame(character: CharacterPayload): void {
  if (!character?.id) {
    console.warn('No se puede iniciar: personaje sin ID');
    return;
  }

  const charId = character.id;

  this.http.get<{ character: CharacterPayload; narrative: string }>(
    `${this.host_url}/gemini/${charId}`
  ).subscribe({
    next: (res) => {
      // Guardamos ambos datos
      localStorage.setItem('selectedCharacter', JSON.stringify(res.character));
      localStorage.setItem('gameNarrative', JSON.stringify({ response: res.narrative }));
      
      console.log('Partida iniciada - Personaje:', res.character);
      console.log('Narrativa inicial:', res.narrative.substring(0, 200) + '...');

      // Navegamos al juego
      this.router.navigate(['/game']);
    },
    error: (err) => {
      console.error('Error al iniciar la partida:', err);
      // Aquí pondrías un toast: "No se pudo iniciar la aventura"
    }
  });
}

goToMenu() {
  this.router.navigate(['/start-menu']);
}


}
