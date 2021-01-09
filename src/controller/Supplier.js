zn.define(function (){

    var node_xlsx = require('xlsx');

    return zn.Controller('supplier', {
        methods: {
            getQuotes: {
                method: 'GET/POST',
                argv: {
                    supplier: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier");

                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_supplier_product_quote',
                                fields: 'product_model, price',
                                where: [
                                    "supplier_id=" + _supplier
                                ]
                            })
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },
            orders: {
                method: 'GET/POST',
                argv: {
                    supplier: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier");

                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.paging({
                                table: 'zn_workflow_stock_in left join zn_plugin_workflow_instance on zn_workflow_stock_in.zn_plugin_workflow_instance_id = zn_plugin_workflow_instance.id',
                                fields: [
                                    'zn_workflow_stock_in.id as stock_id',
                                    'zn_workflow_stock_in.invoice_status as receipt_invoice_status',
                                    'zn_workflow_stock_in.invoice_note as receipt_invoice_note',
                                    'zn_workflow_stock_in.invoice_number as receipt_invoice_number',
                                    'zn_workflow_stock_in.invoice_attachments as receipt_invoice_attachments',
                                    'zn_workflow_stock_in.supplier as supplier_id',
                                    'zn_chunrui_oa_convert_supplier(zn_workflow_stock_in.supplier) as supplier_convert',
                                    'zn_plugin_stock_convert_warehouse(zn_workflow_stock_in.in_warehouse) as in_warehouse_convert',
                                    'zn_plugin_workflow_instance.id as wfi_id',
                                    'zn_plugin_workflow_instance.code as code',
                                    'zn_plugin_workflow_instance.state as state',
                                    'zn_plugin_workflow_instance.closed as closed',
                                    'zn_plugin_workflow_instance.zn_create_time as zn_create_time',
                                    'zn_plugin_workflow_instance.zn_modify_time as zn_modify_time',
                                    'zn_plugin_workflow_instance.zn_note as zn_note',
                                    'zn_plugin_admin_convert_user(zn_plugin_workflow_instance.zn_create_user) as zn_create_user_convert',
                                    'zn_plugin_workflow_convert_index(zn_plugin_workflow_instance.index_id) as index_id_convert',
                                    'zn_plugin_workflow_convert_instance_current_state(zn_plugin_workflow_instance.id) as current_state'
                                ],
                                where: [
                                    "zn_workflow_stock_in.supplier=" + _supplier,
                                    " and zn_plugin_workflow_instance.code<>''"
                                ],
                                pageIndex: request.getValue('pageIndex'),
                                pageSize: request.getValue('pageSize')
                            })
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            },
            order_details: {
                method: 'GET/POST',
                argv: {
                    supplier: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier"),
                        _status = request.getValue('status'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end');
                    var _value = {};
                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_in left join zn_plugin_workflow_instance on zn_workflow_stock_in.zn_plugin_workflow_instance_id = zn_plugin_workflow_instance.id',
                                fields: [
                                    'zn_workflow_stock_in.id as stock_id',
                                    'zn_workflow_stock_in.invoice_status as receipt_invoice_status',
                                    'zn_workflow_stock_in.invoice_note as receipt_invoice_note',
                                    'zn_workflow_stock_in.invoice_number as receipt_invoice_number',
                                    'zn_workflow_stock_in.invoice_attachments as receipt_invoice_attachments',
                                    'zn_workflow_stock_in.supplier as supplier_id',
                                    'zn_chunrui_oa_convert_supplier(zn_workflow_stock_in.supplier) as supplier_convert',
                                    'zn_plugin_stock_convert_warehouse(zn_workflow_stock_in.in_warehouse) as in_warehouse_convert',
                                    'zn_plugin_workflow_instance.id as wfi_id',
                                    'zn_plugin_workflow_instance.code as code',
                                    'zn_plugin_workflow_instance.state as state',
                                    'zn_plugin_workflow_instance.closed as closed',
                                    'zn_plugin_workflow_instance.zn_create_time as zn_create_time',
                                    'zn_plugin_workflow_instance.zn_modify_time as zn_modify_time',
                                    'zn_plugin_workflow_instance.zn_note as zn_note',
                                    'zn_plugin_admin_convert_user(zn_plugin_workflow_instance.zn_create_user) as zn_create_user_convert',
                                    'zn_plugin_workflow_convert_index(zn_plugin_workflow_instance.index_id) as index_id_convert',
                                    'zn_plugin_workflow_convert_instance_current_state(zn_plugin_workflow_instance.id) as current_state'
                                ],
                                where: [
                                    "zn_workflow_stock_in.supplier=" + _supplier,
                                    " and zn_plugin_workflow_instance.code<>''",
                                    _status!=null?' and zn_workflow_stock_in.invoice_status=' + _status:'',
                                    _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                                    _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                                ]
                            })
                        })
                        .query('select details: ', function (sql, data){
                            var _ids = data.map(function (item){
                                return item.stock_id;
                            });
                            _value.orders = data;
                            _value.ids = _ids;
                            if(_ids.length){
                                return zn.sql.select({
                                    table: 'zn_workflow_stock_in_details',
                                    where: "zn_plugin_workflow_primary_id in ("+_ids.join(',')+")"
                                });
                            }else {
                                _value.orderdetails = [];
                                return response.success(_value), false;
                            }
                        }, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                _value.orderdetails = data;
                                response.success(_value);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
