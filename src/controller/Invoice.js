zn.define(['node:axios'], function (axios){

    var node_xlsx = require('xlsx');

    return zn.Controller('invoice', {
        methods: {
            updateInvoiceExpressInfo: {
                method: 'GET/POST',
                argv: {
                    invoice_id: null
                },
                value: function (request, response, chain){
                    var _invoice_id = request.getValue('invoice_id'),
                        _express_data = null;
                    this.beginTransaction()
                        .query("select order", function (sql, data){
                            return zn.sql.select({
                                table: 'zn_chunrui_oa_customer_invoice left join zn_chunrui_oa_express_company on locate(zn_chunrui_oa_customer_invoice.express_company, zn_chunrui_oa_express_company.title)>0',
                                fields: [
                                    'zn_chunrui_oa_customer_invoice.express_code as express_code',
                                    'zn_chunrui_oa_express_company.code as express_company'
                                ],
                                where: "zn_chunrui_oa_customer_invoice.id=" + _invoice_id
                            });
                        })
                        .query("", function (sql, data){
                            var _item = data[0];
                            if(_item){
                                if(!_item.express_company){
                                    return response.error("系统未查到该快递公司信息, 请确认后再查询."), false;
                                }
                                if(!_item.express_code){
                                    return response.error("该订单中快递单号为空"), false;
                                }
                                var _param = {
                                    key: 'WCSAhVics5bx',
                                    com: _item.express_company,
                                    cno: _item.express_code
                                },
                                _defer = zn.async.defer();
                                axios({
                                    method: 'get',
                                    url: 'http://api.kuaidiwo.cn:88/api/?'+zn.querystring.stringify(_param)
                                }).then(function (response){
                                    try {
                                        var _data = response.data;
                                        if(+_data.errcode==0){
                                            _defer.resolve(_data);
                                        }else {
                                            _defer.reject(new Error("请求失败：" + _data.message));
                                            response.error("请求失败：" + _data.message);
                                        }
                                    } catch (e) {
                                        _defer.reject(e);
                                        response.error("请求失败：" + e.message);
                                    }
                                });
                                return _defer.promise;
                            }else {
                                return response.error("未查到订单"), false;
                            }
                        })
                        .query("select done count", function (sql, data){
                            var _updates = {};
                            _express_data = data;
                            if(+data.errcode==0){
                                _updates.express_state = data.ems_info.state;
                                _updates.express_data = JSON.stringify(data);
                            }else {
                                _updates.express_state = -1;
                                _updates.express_data = JSON.stringify(data);
                            }
                            return zn.sql.update({
                                table: 'zn_chunrui_oa_customer_invoice',
                                updates: _updates,
                                where: { id: _invoice_id }
                            })
                        }, function (error, data){
                            if(error){
                                response.error(error);
                            }else {
                                response.success(_express_data);
                            }
                        })
                        .commit();
                }
            },
            createInvoice: {
                method: 'GET/POST',
                argv: {
                    customer: null,
                    data: null
                },
                value: function (request, response, chain){
                    var _customer = request.getValue("customer"),
                        _data = request.getValue('data');
                    this.beginTransaction()
                        .query(zn.sql.insert({
                            table: 'zn_chunrui_oa_customer_invoice',
                            values: {
                                customer_id: _customer,
                                count: request.getValue('count'),
                                sum: request.getValue('sum')
                            }
                        }))
                        .query('insert detail: ', function (sql, data){
                            var _invoice = data,
                                _ids = [];
                            var _sqls = _data.map(function (item, index){
                                item.order_ids = item.order_ids.join(',');
                                item.invoice_id = _invoice.insertId;
                                _ids = _ids.concat(item.order_ids);
                                return zn.sql.insert({
                                    table: 'zn_chunrui_oa_customer_invoice_detail',
                                    values: item
                                });
                            });

                            _sqls.push(zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                updates: { invoice_id: _invoice.insertId },
                                where: "id in ("+_ids.join(',')+")"
                            }));

                            _sqls.push(zn.sql.update({
                                table: 'zn_chunrui_oa_customer_invoice',
                                updates: { order_ids: _ids.join(',') },
                                where: {
                                    id: _invoice.insertId
                                }
                            }));

                            return _sqls.join('');
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
            trashInvoice: {
                method: 'GET/POST',
                argv: {
                    invoice_id: null
                },
                value: function (request, response, chain){
                    var _invoice_id = request.getValue("invoice_id");
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_chunrui_oa_customer_invoice',
                            fields: 'id, order_ids',
                            where: {
                                id: _invoice_id
                            }
                        })+zn.sql.select({
                            table: 'zn_chunrui_oa_customer_invoice_detail',
                            fields: 'id, order_ids',
                            where: {
                                invoice_id: _invoice_id
                            }
                        }))
                        .query('trash invoice: ', function (sql, data){
                            var _invoice = data[0][0],
                                _invoice_details = data[1];
                            var _sqls = _invoice_details.map(function (item, index){
                                return zn.sql.update({
                                    table: 'zn_workflow_stock_sale_receipt_products',
                                    updates: { invoice_id: 0 },
                                    where: "id in (" + item.order_ids + ")"
                                });
                            });

                            _sqls.push(zn.sql.update({
                                table: 'zn_chunrui_oa_customer_invoice',
                                updates: { status: -1 },
                                where: { id: _invoice_id }
                            }));

                            return _sqls.join('');
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
            getInvoiceInfo: {
                method: 'GET/POST',
                argv: {
                    invoice_id: null
                },
                value: function (request, response, chain){
                    var _invoice_id = request.getValue("invoice_id");
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_chunrui_oa_customer_invoice',
                            fields: '*',
                            where: {
                                id: _invoice_id
                            }
                        })+zn.sql.select({
                            table: 'zn_chunrui_oa_customer_invoice_detail',
                            fields: '*',
                            where: {
                                invoice_id: _invoice_id
                            }
                        }), null, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                var _invoice = data[0][0],
                                    _invoice_details = data[1];
                                response.success({invoice: _invoice, details: _invoice_details});
                            }
                        })
                        .commit();
                }
            },
            pagingInvoices: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _customer = request.getValue("customer_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');

                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.beginTransaction()
                        .query(zn.sql.paging({
                            table: 'zn_chunrui_oa_customer_invoice',
                            fields: [
                                '*',
                                'zn_chunrui_oa_convert_customer(customer_id) as customer'
                            ],
                            where: [
                                "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                                _customer!=null?" and customer_id=" + _customer:'',
                                _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                                _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                            ],
                            order: {
                                'zn_create_time': 'desc',
                                'zn_modify_time': 'desc'
                            },
                            pageIndex: request.getValue('pageIndex'),
                            pageSize: request.getValue('pageSize')
                        }), null, function (err, data){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(data);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
