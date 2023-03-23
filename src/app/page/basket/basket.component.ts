import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatapassService } from 'src/app/datapass.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.scss']
})
export class BasketComponent implements OnInit{

  foodsBasket:Array<any>=[];
  foodName:String = "";
  index:number = -1;
  total:number = 0;

  constructor(private http : HttpClient,
    public data:DatapassService,
    private router:Router){}

  ngOnInit(){
    if(!this.data.isLogin){
      this.router.navigateByUrl('/');
      return;
    }

    this.getCart();

  }

  async getCart(){
    await firstValueFrom(this.http.get('http://localhost/jt-services/cart/'+this.data.userinfo.oid))
    .then((data:any) => {
      this.foodsBasket = data;
      console.log(this.foodsBasket);

    });
  }

  async confirmOrder(){
    if(this.data.userData.name != ''
      && this.data.userData.phone != ''
      && this.data.userData.address != ''){
      this.http.get('http://localhost/iorder/customer/update/'+this.data.userData.oid)
      .subscribe();
      this.http.post('http://localhost/jt-services/history/insert',JSON.stringify(this.data.userData))
      .subscribe();
      let allFood:Array<any> = new Array<any>();
      let foodlist:Array<any> =[];
      let foods:any = localStorage.getItem('foods');
      foodlist = JSON.parse(foods);

      for(let food of foodlist){
        let json = {
          "oid": this.data.userData.oid,
          "fid": food.fid,
          "amount": food.amount
        }
        allFood.push(json);
      }
      this.http.post('http://localhost/jt-services/cart/insert',JSON.stringify(allFood))
      .subscribe();

      localStorage.removeItem('foods');
      localStorage.removeItem('orderAmount')
      this.router.navigateByUrl('/').then(()=>{
        window.location.reload();
      });
    }
    else{
      this.data.alert = '*กรอกข้อมูลให้ครบ'
    }
  }

  delBasket(index:number){
    this.foodName = this.foodsBasket[index].name;
    this.index = index;
    this.calTotal();
  }

  async addAmount(fid:any){
    let orderAmount = {
      "fid" : fid,
      "oid" : this.data.userinfo.oid,
      "amount" : 1
    }
    console.log(JSON.stringify(orderAmount));


    await firstValueFrom(this.http.post('http://localhost/jt-services/cart/amount', JSON.stringify(orderAmount)))
    .then(data => {
      this.getCart();
    });
  }

  async delAmount(fid:any){
    console.log(fid);

    let orderAmount = {
      "fid" : fid,
      "oid" : this.data.userinfo.oid,
      "amount" : -1
    }
    await firstValueFrom(this.http.post('http://localhost/jt-services/cart/amount', JSON.stringify(orderAmount)))
    .then(data => {
      this.getCart();
    });
  }

  delConfirm(){
    if(localStorage.getItem('foods')){
      let food = localStorage.getItem('foods');
      if(food != null){
        let foodListJSON:Array<any> = JSON.parse(food);
        foodListJSON.splice(this.index, 1);
        localStorage.setItem('foods', JSON.stringify(foodListJSON));
        this.foodsBasket = foodListJSON;
        localStorage.setItem('orderAmount', JSON.stringify(this.foodsBasket.length));
        this.data.orderAmount = localStorage.getItem('orderAmount');
        if(this.data.orderAmount <= 0){
          localStorage.removeItem('orderAmount')
        }
        this.calTotal();
      }
    }
  }

  async calTotal(){
    let count = 0;
    let json:any;
    let foods:Array<any>=[];
    if(localStorage.getItem('foods')){
      let data:any = localStorage.getItem('foods');
      await firstValueFrom(this.http.post('http://localhost/jt-services/cart/calculatePrice',JSON.stringify(JSON.parse(data))))
      .then(response => {
        json = response;
        foods = json;
        for(let food of foods){
          count += Number(food.priceTotal);
        }
      });
    }
    this.total = count;
  }
}
