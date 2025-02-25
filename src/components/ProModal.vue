<template>
  <div class="modal-backdrop">
    <div class="modal">
      <header class="modal-header">
        <slot name="header">
          {{ CoffeeOptions.description }}
        </slot>
        <button type="button" class="btn-close" @click="close">x</button>
      </header>

      <section class="modal-body">
        <aside class="coffeeImg">{{ CoffeeOptions.coffeeName }}</aside>
        <div class="bodytest" name="body">
          <h2>{{ CoffeeOptions.coffeeName }}</h2>
          <h3>Price : Ξ {{ (amount > 0 ? amount : 1) * newPrice }} / <small>{{ (amount > 0 ? amount : 1) * 100 }}g</small></h3>

          <div class="modal_main">
            <div class="right">
              <div>
                <select v-model="selectedOption" @change="resetAmount" class="table-primary form-control">
                  <option value="no" selected disabled>Select your Coffee Bean Type</option>
                  <option v-for="(option, idx) in options" :key="idx" :value="option">
                    {{ option.type }} ({{ getAvailableQuantities(option.type) }} available)
                  </option>
                </select>
              </div>
              <div>
                <span v-show="!flag"> weight(100g) :</span>
                <input min="0" :max="getAvailableQuantities(selectedOption ? selectedOption.type : null)" v-show="!flag" type="number" v-model.number="amount" @change="totalCh()">
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="modal-footer">
        <button v-if="sessionCheck && !isDistributor && !isSeller" type="button" class="btn-green" @click="addTocart">Add Cart</button>
      </footer>
    </div>
  </div>
</template>

<script>

import { mapActions } from 'vuex';
import { mapGetters } from 'vuex';  // Vuex의 getter를 사용하기 위해 mapGetters를 임포트
//import { productClass } from '@/classes/productClass';
import readJson from '../services/JsonService.js';

export default {
  name: 'ProModal',
  props: ['CoffeeOptions'],
  data() {
    return {
      selectedOption: 'no',  
      options: '',
      optionFee: 0,
      amount: 0,
      flag: false,
      total: 0,
      newPrice: 0,
      logedUser: null,
      userID: 0,
      sessionCheck: false,
      isDistributor: false,
      isSeller: false,
      isCustomer: false
    };
  },
  computed: {
    ...mapGetters(['getConfirmedProductions', 'getShoppingCart']),
  },
  methods: {
    ...mapActions(['addCoffeeShoppingCart', 'deleteCoffeeShoppingCart']),
    resetAmount() {
      this.amount = 0; // 선택 옵션 변경 시 amount를 0으로 설정
      this.totalCh(); // 선택 변경 후 총합을 다시 계산
    },
    close() {
      this.total = 0;
      this.amount = 0;
      this.newPrice = 0;
      this.selectedOption = 'no';
      this.$emit('close');
    },
    addTocart() {
      if (!this.selectedOption) {
        alert("You have to choose all the options");
      } else if (this.amount == 0) {
        alert("You cannot add 0 to cart");
      } else {
        const availableQuantity = this.getAvailableQuantities(this.selectedOption.type);
        if (this.amount > availableQuantity) {
          alert("Selected amount exceeds available quantity");
        } else {
          // Get the TxInfo for the product
          const product = this.getConfirmedProductions.find(
            item =>
              item.coffeeName === this.CoffeeOptions.coffeeName &&
              item.beanType === this.selectedOption.type
          );

          if (product && product.TxInfo) {
            // Calculate the required txHashes and quantities
            const requiredTxInfo = this.calculateRequiredTxInfo(product.TxInfo, this.amount);

            const cartItem = {
              pId: this.CoffeeOptions.pId,
              coffeeName: this.CoffeeOptions.coffeeName,
              price: this.CoffeeOptions.price,
              bType: this.selectedOption.type,
              amount: this.amount,
              origin: this.CoffeeOptions.origin,
              txInfo: requiredTxInfo, // Include the required TxInfo
            };

            const userId = this.logedUser.id;
            const shoppingCart = this.getShoppingCart(userId);
            // 장바구니에서 동일한 아이템이 있는지 확인
            const existingCartItemIndex = shoppingCart.findIndex(
              item => item.coffeeName === cartItem.coffeeName && item.bType === cartItem.bType
            );

            if (existingCartItemIndex !== -1) {
              this.deleteCoffeeShoppingCart({userId, existingCartItemIndex});
              this.addCoffeeShoppingCart({ userId, production: cartItem });
            }
            else {
              this.addCoffeeShoppingCart({ userId, production: cartItem });
            }

            this.total = 0;
            this.amount = 0;
            this.selectedOption = 'no';
            this.flag = false;
            this.$emit('close');
            this.$emit('cartAdding', cartItem);

          } else {
            alert('Product information is not available.');
          }
        }
      }
    },
    calculateRequiredTxInfo(txInfoArray, amountNeeded) {
      const requiredTxInfo = [];
      let remainingAmount = Number(amountNeeded);
      for (const txInfo of txInfoArray) {
        if (remainingAmount <= 0) break;
        const availableQuantity = Number(txInfo.quantity);
        const quantityToUse = Math.min(availableQuantity, remainingAmount);
        requiredTxInfo.push({
          txHash: txInfo.txHash,
          quantity: quantityToUse,
          timestamp: txInfo.timestamp,
        });
        remainingAmount -= quantityToUse;
      }
      if (remainingAmount > 0) {
        alert('Not enough stock to fulfill the order.');
        throw new Error('Insufficient stock');
      }
      return requiredTxInfo;
    },
    loadJson() {
      readJson.getJson("option")
        .then(res => {
          this.options = res.data;
        }).catch(err => {
          console.log(err);
        });
    },
    totalCh() {
      let price = this.totalAll();
      this.flag = false;
      this.optionFee = this.selectedOption ? this.selectedOption.fee : 0;
      let price2 = ((price + this.optionFee) * this.amount).toFixed(2);
      this.newPrice = price + this.optionFee;
      this.total = price2;
    },
    totalAll() {
      let cal = 0;
      cal = this.CoffeeOptions.price;
      return cal;
    },
    checkSession() {
      const storedUser = JSON.parse(sessionStorage.getItem('logeduser'));
      if (storedUser) {
        this.logedUser = storedUser;
        this.sessionCheck = true;
        this.isDistributor = this.logedUser.distributor;
        this.isSeller = this.logedUser.seller;
        this.isCustomer = this.logedUser.customer;
        this.userID = this.logedUser.id;
      }
    },
    getAvailableQuantities(beanType) {
      console.log('ConfirmedProductions:', JSON.stringify(this.getConfirmedProductions, null, 2));

      const product = this.getConfirmedProductions.find(
        item =>
          (item.coffeeName === this.CoffeeOptions.coffeeName) &&
          (beanType === item.beanType)
      );

      if (product) {
        const quantity = product.quantity; // 100g 단위로 변환
        return quantity;
      } else {
        console.log('Product not found.');
        return '0';
      }
    },
  },
  watch: {
    newPrice() {
      if (this.newPrice == undefined) {
        console.log('yes');
      }
    },
  },
  mounted() {
    this.loadJson();
    this.checkSession();
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  translate: 21vw;
  height: 80%;
  aspect-ratio: 1;
  background: #FFFFFF;
  box-shadow: 2px 2px 20px 1px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}
.modal-header,
.modal-footer {
  padding: 10px;
  display: flex;
}
.modal-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  padding: 2%;
  justify-content: space-between;
}
.modal-footer {
  border-top: 1px solid #eeeeee;
  flex-direction: column;
}
.modal-body {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
}
.btn-close {
  position: absolute;
  top: 0;
  right: 3%;
  border: none;
  font-size: 20px;
  padding: 5px;
  cursor: pointer;
  font-weight: bold;
  color: grey;
  background: transparent;
}
.btn-green {
  color: white;
  background: #4AAE9B;
  border: 1px solid #4AAE9B;
  border-radius: 5px;
  padding: 1%;
}
.modal_main {
  display: flex;
}
.bean-quantities {
  margin-bottom: 20px;
}
.coffeeImg {
  width: 100%;
  height: 150px;
  border-radius: 10px;
  font-size: 40px;
  font-weight: 700;
  padding-bottom: 2%;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background-image: url(../../public/img/pexels-jessica-lewis-creative-867466.jpg);
  background-position: center;
  background-size: cover;
}
.left {
  width: 65%;
  text-align: center;
  background-color: #4AAE9B;
  color: white;
  margin-right: 5px;
  border-radius: 10px;
}
.right {
  display: flex;
  flex-direction: column;
}
.right div {
  display: flex;
  flex-direction: column;
}
h2, h3, h5 {
  margin: 10px 0px;
}
select {
  padding: 1%;
  border-radius: 5px;
  border: 1px solid #4AAE9B;
  right: 5%;
  bottom: 1%;
}
input {
  padding: 3%;
  border: 1px solid #4AAE9B;
  background: transparent;
}
</style>