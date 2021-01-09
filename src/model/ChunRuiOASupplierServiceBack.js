zn.define(function () {

    return zn.Model("zn_chunrui_oa_supplier_service_back", {
        mixins: [
            zn.db.common.model.Base
        ],
        properties: {
            status: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            sale_service_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            sale_receipt_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            product_model: {
                value: null,
                type: ['varchar', 100],
                default: ''
            },
            back_warehouse: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            customer_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            supplier_id: {
                value: null,
                type: ['int', 11],
                default: 0
            },
            price: {
                value: null,
                type: ['decimal', [10, 2]],
                default: 0
            },
            count: {
                value: null,
                type: ['decimal', [10, 2]],
                default: 0
            },
            amount: {
                value: null,
                type: ['decimal', [10, 2]],
                default: 0
            }
        }
    });

})
