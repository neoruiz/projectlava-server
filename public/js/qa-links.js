/* globals Vue:true VueRouter:true, $:true */
(function() {
    
    new Vue({
        el: '#qa-links',
        components: {},
        data: {
            qaLinks: [],
        },
        methods: {
            getData: function(){
                axios.get(`/urls/${this.$refs['collections'].value}`)
                .then(res => {
                    this.qaLinks = res.data.results
                })
                .catch(err => {
                    console.log(err);
                });
            },
            openUrl: function( url ){
                window.open(url, '_blank');
            },
            updateList: function(){
                this.getData();
            }
        },
        mounted: function() {
            this.getData();
        }
    });
        
    Vue.config.devtools = true;
    Vue.config.productionTip = false;

})();    