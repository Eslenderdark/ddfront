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
  IonSelect, IonSelectOption, IonRange, IonButtons, IonCardHeader, IonCardTitle
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
    IonSelect, IonSelectOption, IonRange, IonButtons, IonCardHeader, IonCardTitle
  ]
})
export class CharactersPage implements OnInit {

  isCreateModalOpen = false;
  newCharacter = {
    name: '',
    race: '',
    stats: {
      strength: 100,
      agility: 100,
      health: 100
    }
  };

  characters: CharacterPayload[] = [];
  host_url = 'http://localhost:3000';
  userId = '';
  luckboost = 0;
  public isLoading = false;

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

    if (this.newCharacter.stats.strength + this.newCharacter.stats.agility + this.newCharacter.stats.health > 300) {
      console.log('Stats exceed maximum total');
      alert('The total of Strength, Agility, and Health must not exceed 300.');
      return;
    }
    else {
      if (!this.newCharacter.name || !this.newCharacter.race) {
        console.log('Fill all fields');
        return;
      }

      if (this.newCharacter.race === 'Elf') {
        this.newCharacter.stats.agility += 20;
      } else if (this.newCharacter.race === 'Goblin') {
        this.luckboost += 20;
      } else if (this.newCharacter.race === 'Orc') {
        this.newCharacter.stats.strength += 20;
      }

      const payload: CharacterPayload = {
        name: this.newCharacter.name,
        hp: this.newCharacter.stats.health,
        strength: this.newCharacter.stats.strength,
        agility: this.newCharacter.stats.agility,
        luck: 100 + this.luckboost,
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
          this.characters.unshift(res.character); // Ahora aparece al principio
          this.closeCreateModal();
          this.resetNewCharacterForm();
        },
        error: (err) => {
          console.error('Error creating character:', err);
        }
      });
    }
  }

  private resetNewCharacterForm() {
    this.newCharacter = {
      name: '',
      race: '',
      stats: {
        strength: 100,
        agility: 100,
        health: 100
      }
    };
  }


  loadCharacters() {
    if (!this.userId) return;
    this.isLoading = true;
    this.http.get<{ characters: CharacterPayload[] }>(`${this.host_url}/characters/user/${this.userId}`)
      .subscribe({
        next: (res) => {
          this.characters = res.characters;
          this.isLoading = false;
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

    if (!charId) {
      console.error('No hay charId seleccionado');
      return;
    }
    localStorage.setItem('selectedCharacterId', charId.toString());


    console.log('Partida iniciada - Personaje:', charId);
    console.log('Narrativa iniciada para el personaje:', charId);

    // Navegamos al juego
    this.router.navigate(['/game']);
  }

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }

  deleteCharacter(character: CharacterPayload): void {
    if (!character?.id) {
      console.warn('No se puede eliminar: personaje sin ID');
      return;
    }
    const charId = character.id;
    this.http.delete<{ message: string }>(`${this.host_url}/characters/${charId}`)
      .subscribe({
        next: (res) => {
          console.log('Personaje eliminado:', res.message);
          this.characters = this.characters.filter(c => c.id !== charId);
        },
        error: (err) => {
          console.error('Error eliminando personaje:', err);
        }
      });
  }
}
