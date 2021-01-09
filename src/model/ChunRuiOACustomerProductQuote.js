zn.define(function () {

    return zn.Model("zn_chunrui_oa_customer_product_quote", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            product_model: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            customer_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            price: {
                value: null,
                type: ['decimal', [10, 2]],
                default: 0
            },
            discount_price: {
                value: null,
                type: ['decimal', [10, 2]],
                default: 0
            }
        }
    });

})
