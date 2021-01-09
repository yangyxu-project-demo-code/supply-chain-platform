zn.define(function () {

    return zn.Model("zn_chunrui_oa_customer_invoice_detail", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            invoice_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            count: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            },
            total_sum: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            },
            product_model: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            product_title: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            order_ids: {
                value: null,
                type: ['varchar', 500],
                default: ''
            }
        }
    });

})
