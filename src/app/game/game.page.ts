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
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { StartMenuPage } from '../start-menu/start-menu.page';
import { volumeHighOutline, volumeLowOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';


@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, RouterModule, CommonModule, FormsModule],
})
export class GamePage implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('iaBox') iaBoxRef!: ElementRef;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    addIcons({ volumeHighOutline, volumeLowOutline });
  }
  public url_host = 'https://ddungeon-back.onrender.com/'; // URL del host del servidor backend
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
    xp: '0'
    };

  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicCategory: string = '';
  public musicVolume: number = 0.4;
  private musicMap: { [key: string]: string[] } = {
    'Combate': ['assets/audio/game/Combate/combate.mp3', 'assets/audio/game/Combate/combate2.mp3'],
    'Misterio': ['assets/audio/game/Misterio/misterio.mp3', 'assets/audio/game/Misterio/misterio2.mp3', 'assets/audio/game/Misterio/misterio3.mp3'],
    'Exploración': ['assets/audio/game/Exploracion/exploracion.mp3', 'assets/audio/game/Exploracion/exploracion2.mp3'],
    'Descanso': ['assets/audio/game/descanso/descanso.mp3', 'assets/audio/game/descanso/descanso2.mp3'],
    'Tensión': ['assets/audio/game/Tension/tension.mp3', 'assets/audio/game/Tension/tension2.mp3'],
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
    } catch (e) { }
  }

  async recievePrompt() {
    this.isLoading = true;

    this.http
      .get(this.url_host + 'gemini/' + this.charId)
      .subscribe(async (response: any) => {
        this.playerStats = response.character;

        const musicCategory = await this.getMusicCategory(response.narrative);
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
        this.playerStats.xp = response.xp;

        const textToWrite = `\n\n👉 Elegiste ${letterOption}\n\n${response.response}\n\n`;
        const musicCategory = await this.getMusicCategory(response.response);
        await this.changeMusic(musicCategory);

        this.isLoading = false;

        await this.typeText(textToWrite);

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


  async getMusicCategory(text?: string): Promise<string | null> {
    try {
      const narrativeText = text || this.fullNarrative;
      const narrative = encodeURIComponent(narrativeText);
      console.log('Obteniendo categoría de música para el texto:', narrativeText.substring(0, 100) + '...');
      const response: any = await this.http
        .get(this.url_host + 'music/' + this.charId + '?narrative=' + narrative)
        .toPromise();
      return response.music;
    } catch (error) {
      console.error('Error obteniendo categoría de música:', error);
      return null;
    }
  }

  async fadeOutMusic(duration: number = 1000): Promise<void> {
    if (!this.currentMusic) return;
    const audio = this.currentMusic;
    const startVolume = audio.volume;
    const step = 50;
    const steps = duration / step;
    const volumeStep = startVolume / steps;
    return new Promise((resolve) => {
      let currentStep = 0;
      const fade = setInterval(() => {
        if (audio.volume > volumeStep) {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        } else {
          audio.volume = 0;
          clearInterval(fade);
          resolve();
        }
        currentStep++;
      }, step);
    });
  }

  async fadeInMusic(duration: number = 3000): Promise<void> {
    if (!this.currentMusic) return;
    const audio = this.currentMusic;
    const targetVolume = this.musicVolume;
    audio.volume = 0;
    const step = 50;
    const steps = duration / step;
    const volumeStep = targetVolume / steps;
    return new Promise((resolve) => {
      let currentStep = 0;
      const fade = setInterval(() => {
        if (audio.volume < targetVolume - volumeStep) {
          audio.volume = Math.min(targetVolume, audio.volume + volumeStep);
        } else {
          audio.volume = targetVolume;
          clearInterval(fade);
          resolve();
        }
        currentStep++;
      }, step);
    });
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
      await this.fadeOutMusic(1000);
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }

    const musicPath = this.getRandomMusicPath(category);

    if (!musicPath) {
      console.warn('No hay archivo de música para la categoría:', category);
      this.currentMusicCategory = category;
      return;
    }

    this.currentMusic = new Audio(musicPath);
    this.currentMusic.loop = true;
    this.currentMusic.volume = 0;

    try {
      await this.currentMusic.play();
      this.currentMusicCategory = category;
      await this.fadeInMusic(1000);
      console.log('Reproduciendo música:', category, '-', musicPath);
    } catch (error) {
      console.error('Error reproduciendo música:', error);
    }
  }

  getRandomMusicPath(category: string): string | null {
    const musicFiles = this.musicMap[category];

    if (!musicFiles || musicFiles.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * musicFiles.length);
    return musicFiles[randomIndex];
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicCategory = '';
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.currentMusic) {
      this.currentMusic.volume = volume;
    }
  }
}
