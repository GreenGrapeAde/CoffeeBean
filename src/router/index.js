import { createWebHistory, createRouter } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import HomePage from '../components/HomePage.vue'
import ProductsPage from '../components/ProductsPage.vue'
import RecipePage from '../components/RecipePage.vue'
import ShoppingCart from '../components/CartPage.vue'
import MemberShip from '../components/MembershipPage.vue'
import PagenotFound from '../components/PagenotFound.vue'
import ShippingInfoCompo from '../components/ShippingInfoCompo.vue'
import AdminDashboard from '../components/AdminDashboard.vue'

const routes = [
    {
        path: '/',
        alias: '/home',
        name: 'home-page',
        component: HomePage
    },
    {
        path: '/login',
        name: 'login-page',
        component: LoginPage
    },
    {
        path: '/products',
        name: 'products-page', 
        component: ProductsPage
    },
    {
        path: '/recipe',
        name: 'recipe-page', 
        component: RecipePage 
    },
    {
        path: '/shoppingcart',
        name: 'shopping-cart', 
        component: ShoppingCart 
    },
    {
        path: '/membership',
        name: 'member-ship', 
        component: MemberShip 
    },
    {
        path: '/shippinginfo',
        name: 'shippinginfo-compo', 
        component: ShippingInfoCompo 
    },
    {
        path: '/admindashboard',
        name: 'admin-dashboard',
        component: AdminDashboard
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'pagenot-found', 
        component: PagenotFound 
    },
];
const router = createRouter({
    history: createWebHistory(),
    routes
});
export default router;
