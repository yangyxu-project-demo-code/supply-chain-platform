zn.define(function () {

    return zn.Model("zn_chunrui_oa_customer_bill", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            customer_id: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            ticket_id: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            instance_id: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            total_price: {
                value: null,
                type: ['decimal', [10,2]],
                default: 0
            },
            state: {
                value: null,
                type: ['tinyint', 4],
                default: 0
            }
            
        }
    });

})
