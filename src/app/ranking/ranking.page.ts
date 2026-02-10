import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: true,
  imports: [IonContent, IonToolbar, CommonModule, FormsModule, RouterModule]
})
export class RankingPage implements OnInit {

  public url_host = 'https://ddungeon-back.onrender.com/';
  public ranking: any[] = [];
  public isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.getbestplayers();
  }

  getbestplayers() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.url_host}getrankingbestplayers`)
      .subscribe(response => {
        this.ranking = response;
        this.isLoading = false;
      });
  }

getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

getTitle(xp: number): string {
  const lvl = this.getLevel(xp);

  if (lvl >= 30) return 'MYTHIC';
  if (lvl >= 25) return 'IMMORTAL';
  if (lvl >= 22) return 'DIVINE';
  if (lvl >= 20) return 'LEGEND';

  if (lvl >= 18) return 'MASTER';
  if (lvl >= 16) return 'GRANDMASTER';
  if (lvl >= 14) return 'HERO';

  if (lvl >= 12) return 'ELITE';
  if (lvl >= 10) return 'VETERAN';
  if (lvl >= 8)  return 'WARRIOR';

  if (lvl >= 6)  return 'ADVENTURER';
  if (lvl >= 4)  return 'APPRENTICE';
  if (lvl >= 2)  return 'NOVICE';

  return 'RECRUIT';
}

  goToMenu() {
    this.router.navigate(['/start-menu']);
  }
}
