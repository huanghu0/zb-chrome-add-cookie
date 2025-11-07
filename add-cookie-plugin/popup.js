window.onload = function() {
    const { createApp,h } = Vue;
    const { TokenInjector } = TokenInjectorComponent
    
    const app = createApp({
        render() {
            return h(TokenInjector,{
                'default-storage-type':"cookie",
                'default-token-name':"jwt_token",
                'default-expire-hours':12
            })
        }
    });
    app.use(ElementPlus);
    app.use(TokenInjectorComponent);
    app.mount('#app');
}


