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
  name: string;
  hp: number;
  strength: number;
  agility: number;
  luck: number;
  level: number;
  next_level_xp: number;
  current_level_xp: number;
  alive: boolean;
  run: boolean;
  state: any;
  user_id: string;
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
      level: 1,
      next_level_xp: 100,
      current_level_xp: 0,
      alive: true,
      run: false,
      state: {
        race: this.newCharacter.race
      },
      user_id: this.userId
    };

    this.http.post<{ message: string; character: CharacterPayload }>(`${this.host_url}/characters`, payload)
      .subscribe({
        next: (res) => {
          this.characters.push(res.character);
          this.closeCreateModal();
          this.newCharacter = {
            name: '',
            race: '',
            stats: {
              strength: 5,
              agility: 5,
              health: 100
            }
          };
        },
        error: (err) => {
          console.error('Error creating character:', err);
        }
      });

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

  startGame(character: CharacterPayload) {
    if (!character) return;

    // Guardamos personaje seleccionado
    localStorage.setItem('selectedCharacter', JSON.stringify(character));

    // Llamamos al backend para generar la narrativa inicial
    const selectedCharacter = JSON.parse(localStorage.getItem('selectedCharacter')!);


    // Hacer que haga primero el get de /characterplay/:charid del backend <--- para obtener el jugador seleccionado 

    this.http.get<{ character: CharacterPayload }>(`${this.host_url}/characterplay/${character.user_id}`)
      .subscribe({
        next: (res) => {
          console.log('Personaje para jugar:', res.character);
          localStorage.setItem('selectedCharacter', JSON.stringify(res.character));
          this.generateInitialNarrative(res.character);
        },
        error: (err) => {
          console.error('Error al obtener personaje para jugar:', err);
        }
      });
  }

  generateInitialNarrative(selectedCharacter: CharacterPayload) {

    this.http.post(`${this.host_url}/gemini`, { character: selectedCharacter })
      .subscribe({
        next: (res: any) => {
          console.log('Narrativa inicial:', res.response);
          localStorage.setItem('gameNarrative', JSON.stringify(res));
          this.router.navigate(['/game']);
        },
        error: (err) => {
          console.error('Error al generar narrativa:', err);
        }
      });
  }



}
