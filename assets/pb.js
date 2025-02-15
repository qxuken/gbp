import PocketBase from 'pocketbase'

export const PB_CLIENT = new PocketBase()
window.pb = PB_CLIENT
