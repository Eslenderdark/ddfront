import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonToolbar,IonList,IonItem,IonLabel } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: true,
  imports: [IonContent, IonToolbar, CommonModule, FormsModule, IonList,IonItem,IonLabel,RouterModule]
})
export class RankingPage implements OnInit {

  constructor(private http: HttpClient,private router: Router) { }
public url_host = 'http://localhost:3000/';
public ranking: any[] = [];

  ngOnInit() {
    this.getbestplayers()
  }

  getbestplayers() {
  this.http.get<any[]>(`${this.url_host}getrankingbestplayers`)
    .subscribe(response => {
      this.ranking = response;
      console.log(this.ranking)
    });
}
goToMenu() {
  this.router.navigate(['/start-menu']);
}
}
