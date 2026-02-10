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
  public host_url: string = 'https://ddungeon-back.onrender.com';
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
    if (StartMenuPage.audio && StartMenuPage.audioInitialized) {
      if (StartMenuPage.audio.paused) {
        StartMenuPage.audio.play().catch(() => {
          this.addUserInteractionListener();
        });
      }
    } else if (!StartMenuPage.audio) {
      this.startmusic();
      this.addUserInteractionListener();
    } else if (StartMenuPage.audio && !StartMenuPage.audioInitialized) {
      this.addUserInteractionListener();
    }
  }

  addUserInteractionListener() {
    if (this.playAudioOnInteraction) {
      document.removeEventListener('click', this.playAudioOnInteraction);
      document.removeEventListener('touchstart', this.playAudioOnInteraction);
      document.removeEventListener('keydown', this.playAudioOnInteraction);
    }

    this.playAudioOnInteraction = () => {
      if (StartMenuPage.audio) {
        if (StartMenuPage.audio.paused || !StartMenuPage.audioInitialized) {
          StartMenuPage.audio
            .play()
            .then(() => {
              StartMenuPage.audioInitialized = true;
              if (this.playAudioOnInteraction) {
                document.removeEventListener('click', this.playAudioOnInteraction);
                document.removeEventListener('touchstart', this.playAudioOnInteraction);
                document.removeEventListener('keydown', this.playAudioOnInteraction);
              }
            })
            .catch(() => {
              // No log necesario aquí
            });
        }
      }
    };

    document.addEventListener('click', this.playAudioOnInteraction);
    document.addEventListener('touchstart', this.playAudioOnInteraction);
    document.addEventListener('keydown', this.playAudioOnInteraction);
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
      })
      .catch(() => {
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
