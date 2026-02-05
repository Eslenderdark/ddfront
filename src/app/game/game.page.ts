import {
  Component,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { StartMenuPage } from '../start-menu/start-menu.page';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonContent, RouterModule, CommonModule, FormsModule],
})
export class GamePage implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('iaBox') iaBoxRef!: ElementRef;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}
  public url_host = 'http://localhost:3000/'; // URL del host del servidor backend
  public response: any[] = []; // Array de las respuestas del servidor
  public fullNarrative = '';
  public displayedText = '';
  private lastTextLength = 0;
  public isTyping = false;
  public isLoading = false;
  public typingSpeed = 40;
  public charId = Number(localStorage.getItem('selectedCharacterId'));
  public playerStats = {
    id: this.charId,
    description: '',
    hp: '100',
    strength: '100',
    agility: '100',
    luck: '100',
    alive: true,
    run: true,
  };

  // Sistema de música
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicCategory: string = '';
  private musicMap: { [key: string]: string } = {
    Combate: 'assets/audio/game/combate.mp3',
    Misterio: 'assets/audio/game/misterio.mp3',
    Exploración: 'assets/audio/game/exploracion.mp3',
    Descanso: 'assets/audio/game/descanso.mp3',
    Tensión: 'assets/audio/game/misterio.mp3',
  };

  async ngOnInit() {
    await this.recievePrompt();
    StartMenuPage.stopMenuMusic();
  }

  ngOnDestroy() {
    this.stopMusic();
  }

  ngAfterViewChecked() {
    if (this.iaBoxRef && this.displayedText.length > this.lastTextLength) {
      this.scrollToBottom();
      this.lastTextLength = this.displayedText.length;
    }
  }

  scrollToBottom() {
    try {
      const iaBox = this.iaBoxRef.nativeElement;
      iaBox.scrollTop = iaBox.scrollHeight;
    } catch (e) {}
  }

  async recievePrompt() {
    this.isLoading = true;

    this.http
      .get(this.url_host + 'gemini/' + this.charId)
      .subscribe(async (response: any) => {
        this.playerStats = response.character;

        const musicCategory = await this.getMusicCategory();
        await this.changeMusic(musicCategory);

        this.isLoading = false;
        await this.typeText(response.narrative + '\n\n');
      });
  }

  async sendPromptResponse(letterOption: string) {
    if (this.isTyping || this.isLoading) return;

    this.isLoading = true;

    this.http
      .get(this.url_host + 'geminiresponse/' + letterOption)
      .subscribe(async (response: any) => {
        console.log('Respuesta del servidor:', response);

        this.playerStats.hp = response.hp;
        this.playerStats.strength = response.strength;
        this.playerStats.agility = response.agility;
        this.playerStats.luck = response.luck;

        const musicCategory = await this.getMusicCategory();
        await this.changeMusic(musicCategory);

        this.isLoading = false;

        await this.typeText(
          `\n\n👉 Elegiste ${letterOption}\n\n${response.response}\n\n`,
        );

        if (response.alive === false) {
          this.playerStats.alive = false;
          this.stopMusic();
          alert('💀 Has muerto en la aventura. Fin del juego. 💀');
          this.router.navigate(['/start-menu']);
          return;
        }

        if (response.run === false && response.alive === true) {
          this.playerStats.run = false;
          this.stopMusic();
          alert('Has completado tu mision con éxito. ¡Felicidades! Guerrero');
          this.router.navigate(['/start-menu']);
          return;
        }
      });
  }

  async typeText(text: string): Promise<void> {
    this.isTyping = true;

    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          this.fullNarrative += text.charAt(i);
          this.displayedText = this.fullNarrative;
          i++;
        } else {
          clearInterval(interval);
          this.isTyping = false;
          resolve();
        }
      }, this.typingSpeed);
    });
  }


  async getMusicCategory(): Promise<string | null> {
    try {
      const response: any = await this.http
        .get(this.url_host + 'music/' + this.charId)
        .toPromise();
      return response.music;
    } catch (error) {
      console.error('Error obteniendo categoría de música:', error);
      return null;
    }
  }

  async changeMusic(category: string | null) {
    if (!category) {
      console.warn('No se recibió categoría de música');
      return;
    }

    if (this.currentMusicCategory === category) {
      console.log('La música ya es de categoría:', category);
      return;
    }

    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }

    const musicPath = this.musicMap[category];

    if (!musicPath) {
      console.warn('No hay archivo de música para la categoría:', category);
      this.currentMusicCategory = category;
      return;
    }

    this.currentMusic = new Audio(musicPath);
    this.currentMusic.loop = true;
    this.currentMusic.volume = 0.4;

    try {
      await this.currentMusic.play();
      this.currentMusicCategory = category;
      console.log('Reproduciendo música:', category, '-', musicPath);
    } catch (error) {
      console.error('Error reproduciendo música:', error);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicCategory = '';
    }
  }
}
