import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { addIcons } from 'ionicons';
import { volumeHighOutline, volumeMuteOutline } from 'ionicons/icons';

@Component({
  selector: 'app-start-menu',
  templateUrl: './start-menu.page.html',
  styleUrls: ['./start-menu.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, CommonModule, FormsModule, IonGrid, IonRow],
})
export class StartMenuPage implements OnInit {
  public user: any;
  public host_url: string = 'http://localhost:3000';
  public isLogged = false;
  private static audio: HTMLAudioElement | null = null;
  private static audioInitialized = false;
  private currentTrack = 0;
  public volumeMute: boolean = false;
  private firstTrack = 0;
  private fadeInInterval: any = null;
  private playAudioOnInteraction: any = null;

  constructor(
    @Inject(DOCUMENT) public document: Document,
    private route: Router,
    private auth: AuthService,
    private http: HttpClient,
  ) {
    addIcons({ volumeHighOutline, volumeMuteOutline });
  }

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
        coins: 0,
        xp: 0,
      };

      this.http.post(`${this.host_url}/users`, payload).subscribe({
        next: (res: any) => {
          console.log('User guardado:', res);
          localStorage.setItem('user', JSON.stringify(this.user));
        },
        error: (err) => {
          console.error('Error guardando user:', err);
          console.error('URL intentada:', `${this.host_url}/users`);
        },
      });
    });
    this.startmusic();
    this.addUserInteractionListener();
  }

  ionViewWillEnter() {
    // Si el audio existe y está inicializado, asegurarnos de que está sonando
    if (StartMenuPage.audio && StartMenuPage.audioInitialized) {
      if (StartMenuPage.audio.paused) {
        StartMenuPage.audio.play().catch(() => {
          console.log('Audio necesita interacción del usuario');
          this.addUserInteractionListener();
        });
      }
    } else if (!StartMenuPage.audio) {
      // Si no existe, iniciarlo (caso de volver desde otra página después de stopMenuMusic)
      this.startmusic();
      this.addUserInteractionListener();
    } else if (StartMenuPage.audio && !StartMenuPage.audioInitialized) {
      // Si existe pero no está inicializado, añadir listeners
      this.addUserInteractionListener();
    }
  }

  addUserInteractionListener() {
    // Primero limpiar listeners anteriores si existen
    if (this.playAudioOnInteraction) {
      document.removeEventListener('click', this.playAudioOnInteraction);
      document.removeEventListener('touchstart', this.playAudioOnInteraction);
      document.removeEventListener('keydown', this.playAudioOnInteraction);
    }

    // Definir la función de interacción
    this.playAudioOnInteraction = () => {
      console.log('Interacción detectada, intentando reproducir audio');
      
      if (StartMenuPage.audio) {
        // Si existe el audio, intentar reproducirlo
        if (StartMenuPage.audio.paused || !StartMenuPage.audioInitialized) {
          console.log('Intentando reproducir audio pausado/no inicializado');
          StartMenuPage.audio
            .play()
            .then(() => {
              StartMenuPage.audioInitialized = true;
              console.log('Audio iniciado con interacción del usuario');
              
              // Limpiar listeners solo cuando se logra reproducir
              if (this.playAudioOnInteraction) {
                document.removeEventListener('click', this.playAudioOnInteraction);
                document.removeEventListener('touchstart', this.playAudioOnInteraction);
                document.removeEventListener('keydown', this.playAudioOnInteraction);
              }
            })
            .catch((error) => {
              console.log('No se pudo reproducir el audio aún:', error);
            });
        } else {
          console.log('Audio ya está reproduciéndose');
        }
      } else {
        console.log('No existe audio para reproducir');
      }
    };
    
    // Añadir nuevos listeners
    document.addEventListener('click', this.playAudioOnInteraction);
    document.addEventListener('touchstart', this.playAudioOnInteraction);
    document.addEventListener('keydown', this.playAudioOnInteraction);
    console.log('Event listeners de audio añadidos');
  }

  handleAuth() {
    if (this.isLogged) {
      this.logout();
    } else {
      this.login();
    }
  }

  goTo(page: string) {
    console.log('Moving to:', page);
    this.route.navigate(['/' + page]);
  }

  login() {
    this.auth.loginWithRedirect({
      appState: {
        target: '/start-menu',
      },
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.auth.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
  }

  startmusic() {
    if (StartMenuPage.audio && !StartMenuPage.audio.paused) {
      return;
    }
    
    if (StartMenuPage.audio && StartMenuPage.audio.paused) {
      StartMenuPage.audio.play().catch(() => {
        console.log('Audio necesita interacción del usuario');
        this.addUserInteractionListener();
      });
      return;
    }
    
    this.firstTrack = Math.random() < 0.5 ? 0 : 1;
    this.currentTrack = this.firstTrack;
    this.playTrack();
  }

  static stopMenuMusic() {
    if (StartMenuPage.audio) {
      StartMenuPage.audio.pause();
      StartMenuPage.audio.currentTime = 0;
      StartMenuPage.audio.src = '';
      StartMenuPage.audio = null;
      StartMenuPage.audioInitialized = false;
    }
  }

  static startMenuMusic() {
    if (StartMenuPage.audio) {
      return;
    }
  }

  playTrack() {
    const tracks = [
      'assets/audio/menu/menu1.mp3',
      'assets/audio/menu/menu2.mp3',
    ];

    if (StartMenuPage.audio) {
      const oldAudio = StartMenuPage.audio;
      oldAudio.pause();
      oldAudio.src = '';
    }

    StartMenuPage.audio = new Audio(tracks[this.currentTrack]);
    StartMenuPage.audio.volume = 0;

    const onEnded = () => {
      this.currentTrack = this.currentTrack === 0 ? 1 : 0;
      this.playTrack();
    };
    StartMenuPage.audio.addEventListener('ended', onEnded);

    const onTimeUpdate = () => {
      if (!StartMenuPage.audio || this.volumeMute) return;
      const timeLeft =
        StartMenuPage.audio.duration - StartMenuPage.audio.currentTime;
      if (timeLeft <= 3 && timeLeft > 0 && StartMenuPage.audio.volume > 0.05) {
        StartMenuPage.audio.volume = Math.max(
          0,
          StartMenuPage.audio.volume - 0.02,
        );
      }
    };
    StartMenuPage.audio.addEventListener('timeupdate', onTimeUpdate);

    StartMenuPage.audio
      .play()
      .then(() => {
        StartMenuPage.audioInitialized = true;
        let vol = 0;
        if (this.fadeInInterval) {
          clearInterval(this.fadeInInterval);
        }
        this.fadeInInterval = setInterval(() => {
          if (StartMenuPage.audio && vol < 0.2 && !this.volumeMute) {
            vol += 0.02;
            StartMenuPage.audio.volume = vol;
          } else {
            clearInterval(this.fadeInInterval);
            this.fadeInInterval = null;
          }
        }, 50);
        console.log(`Reproduciendo pista ${this.currentTrack + 1}`);
      })
      .catch(() => {
        console.log('Esperando interacción del usuario para reproducir');
        this.addUserInteractionListener();
      });
  }

  toggleMute() {
    this.volumeMute = !this.volumeMute;
    if (StartMenuPage.audio) {
      if (this.volumeMute) {
        StartMenuPage.audio.volume = 0;
      } else {
        StartMenuPage.audio.volume = 0.2;
      }
    }
  }

  ngOnDestroy() {        

    if (this.fadeInInterval) {
      clearInterval(this.fadeInInterval);
    }

    if (this.playAudioOnInteraction) {
      document.removeEventListener('click', this.playAudioOnInteraction);
      document.removeEventListener('touchstart', this.playAudioOnInteraction);
      document.removeEventListener('keydown', this.playAudioOnInteraction);
    }
  }
}
