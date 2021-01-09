zn.define(function (){

    var node_xlsx = require('xlsx');

    return zn.Controller('customer', {
        methods: {
            getAccount: {
                method: 'GET/POST',
                argv: {
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer");
                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer',
                                fields: [
                                    'account'
                                ],
                                where: [
                                    "zn_deleted=0 and id=" + _customer
                                ]
                            });
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
            getSaleOrders: {
                method: 'GET/POST',
                argv: {
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _total = request.getValue('total'),
                        _where = request.getValue('where');

                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                fields: [
                                    'id, product_model, price, count, total_sum',
                                    'zn_plugin_stock_convert_product_model(product_model) as product_title'
                                ],
                                where: [
                                    "zn_deleted=0 and invoice_id=0 and status=1" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                                    _customer!=null?" and customer_id=" + _customer:'',
                                    _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                                    _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                                ],
                                order: {
                                    'priority': 'desc',
                                    'zn_create_time': 'desc',
                                    'zn_modify_time': 'desc'
                                }
                            });
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
            getQuotes: {
                method: 'GET/POST',
                argv: {
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer");

                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer_product_quote',
                                fields: 'product_model, price',
                                where: [
                                    "customer_id=" + _customer
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
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer"),
                        _where = request.getValue('where');
                    //var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.paging({
                                table: 'zn_workflow_stock_sale_receipt left join zn_plugin_workflow_instance on zn_workflow_stock_sale_receipt.zn_plugin_workflow_instance_id = zn_plugin_workflow_instance.id',
                                fields: [
                                    'zn_workflow_stock_sale_receipt.id as receipt_id',
                                    'zn_workflow_stock_sale_receipt.invoice_status as receipt_invoice_status',
                                    'zn_workflow_stock_sale_receipt.invoice_note as receipt_invoice_note',
                                    'zn_workflow_stock_sale_receipt.invoice_number as receipt_invoice_number',
                                    'zn_workflow_stock_sale_receipt.invoice_attachments as receipt_invoice_attachments',
                                    'zn_workflow_stock_sale_receipt.customer as customer_id',
                                    'zn_chunrui_oa_convert_customer(zn_workflow_stock_sale_receipt.customer) as customer_convert',
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
                                    //"zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                                    "zn_workflow_stock_sale_receipt.customer=" + _customer,
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
                    customer: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer"),
                        _status = request.getValue('status'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end');
                    var _value = {};
                    this.beginTransaction()
                        .query('query: ', function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_sale_receipt left join zn_plugin_workflow_instance on zn_workflow_stock_sale_receipt.zn_plugin_workflow_instance_id = zn_plugin_workflow_instance.id',
                                fields: [
                                    'zn_workflow_stock_sale_receipt.id as receipt_id',
                                    'zn_workflow_stock_sale_receipt.invoice_status as receipt_invoice_status',
                                    'zn_workflow_stock_sale_receipt.invoice_note as receipt_invoice_note',
                                    'zn_workflow_stock_sale_receipt.invoice_number as receipt_invoice_number',
                                    'zn_workflow_stock_sale_receipt.invoice_attachments as receipt_invoice_attachments',
                                    'zn_chunrui_oa_convert_customer(zn_workflow_stock_sale_receipt.customer) as customer_convert',
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
                                    "zn_workflow_stock_sale_receipt.customer=" + _customer,
                                    " and zn_plugin_workflow_instance.code<>''",
                                    _status!=null?' and zn_workflow_stock_sale_receipt.invoice_status=' + _status:'',
                                    _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                                    _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                                ]
                            })
                        })
                        .query('select details: ', function (sql, data){
                            var _ids = data.map(function (item){
                                return item.receipt_id;
                            });
                            _value.orders = data;
                            _value.ids = _ids;
                            if(_ids.length){
                                return zn.sql.select({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    fields: [
                                        '*',
                                        'zn_plugin_stock_convert_warehouse(out_warehouse) as out_warehouse_convert',
                                    ],
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
