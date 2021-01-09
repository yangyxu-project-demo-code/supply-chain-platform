zn.define(function (){

    var node_officegen = require('officegen'),
        node_xlsx = require('xlsx');

    return zn.Controller('sale', {
        methods: {
            cancelSaleOrderService: {
                method: 'GET/POST',
                argv: {
                    sale_order_id: null
                },
                value: function (request, response, chain){
                    var _sale_order_id = request.getValue('sale_order_id');
                    this.beginTransaction()
                        .query(zn.sql.select({
                            table: 'zn_workflow_stock_sale_receipt_products',
                            where: { id: _sale_order_id, status: -1 }
                        }))
                        .query('', function (sql, data){
                            var _order = data[0];
                            if(!_order){
                                return response.error('未查到售后中订单'), false;
                            }
                            return zn.sql.delete({
                                table: 'zn_plugin_workflow_instance',
                                where: "id={0} or parent_id={0}".format(_order.service_wf_instance_id)
                            }) + zn.sql.delete({
                                table: _order.service_table,
                                where: "id={0}".format(_order.service_id)
                            }) + zn.sql.update({
                                table: 'zn_workflow_stock_sale_receipt_products',
                                updates: {
                                    status: 1
                                },
                                where: { id: _sale_order_id }
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
            updateOutWfs: {
                method: 'GET/POST',
                argv: {
                    wf_instance_id: null,
                    sale_receipt_id: null
                },
                value: function (request, response, chain){
                    this.query(zn.sql.update({
                        table: 'zn_workflow_stock_sale_receipt',
                        updates: "out_wfs=concat(out_wfs,"+request.getInt('wf_instance_id')+", ',')",
                        where: { id: request.getInt('sale_receipt_id') }
                    })).then(function (data){
                        response.success(data);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            importExpressCode: {
                method: 'GET/POST',
                argv: {
                    start: 1
                },
                value: function (request, response, chain){
                    var _files = request.$files,
                        _result = [],
                        _sqls = [],
                        _start = request.getInt('start') || 2,
                        _vars = JSON.parse(request.getValue('vars')||'{}');

                    this.beginTransaction()
                        .query('update express_code', function (sql, rows){
                            zn.each(_files, function (file, key){
                                var _file = request.uploadFile(file),
                                    _worksheet = node_xlsx.readFile(_file.path),
                                    _data = [];
                                Object.keys(_worksheet.Sheets).map((name)=>{
                                    _data = node_xlsx.utils.sheet_to_json(_worksheet.Sheets[name], {
                                        header: 1,
                                        raw: true
                                    });

                                    zn.each(_data, function (item, index){
                                        if(index > (_start-1)){
                                            if(item.length){
                                                var _values = { },
                                                    _value = null,
                                                    _name = null;
                                                for(var i = 0; i < item.length; i++){
                                                    _value = item[i]||'';
                                                    _name = _vars[i]||'';
                                                    if(!_name || !_value){
                                                        continue;
                                                    }
                                                    _values[_name] = _value;
                                                }
                                                _sqls.push(zn.sql.update({
                                                    table: 'zn_workflow_stock_sale_receipt_products',
                                                    updates: _values,
                                                    where: "order_code='{0}'".format(_values.order_code)
                                                }));
                                            }
                                        }
                                    });
                                });
                            });

                            return _sqls.join('');
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success("导入成功");
                            }
                        }).commit();
                }
            },
            getWorkFlowInstanceDetails: {
                method: 'GET/POST',
                argv: {
                    wfinstance: null
                },
                value: function (request, response, chain){
                    this.query(zn.sql.select({
                        table: 'zn_workflow_stock_sale_receipt',
                        where: { zn_plugin_workflow_instance_id: request.getInt('wfinstance') }
                    }) + zn.sql.select({
                        table: 'zn_workflow_stock_sale_receipt_products',
                        fields: '*, zn_plugin_stock_convert_product_model(product_model) as product_title, product_model',
                        where: {
                            zn_plugin_workflow_instance_id: request.getInt('wfinstance')
                        }
                    })).then(function (data){
                        response.success(data);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            getCustomerProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _customer = request.getValue("customer_id"),
                        _status = request.getValue('status'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');

                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;

                    this.query(zn.sql.paging({
                        table: 'zn_workflow_stock_sale_receipt_products',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title, product_model',
                            'zn_plugin_stock_convert_warehouse(out_warehouse) as warehouse, out_warehouse'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _customer!=null?" and customer_id=" + _customer:'',
                            _status!=null?' and status=' + _status:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: {
                            'priority': 'desc',
                            'zn_create_time': 'desc'
                        },
                        pageIndex: request.getValue('pageIndex'),
                        pageSize: request.getValue('pageSize')
                    })).then(function (data){
                            response.success(data);
                        }, function (err) {
                            response.error(err);
                        });
                }
            },
            downloadCustomerProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _customer = request.getValue("customer_id"),
                        _status = request.getValue('status'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    if(typeof _where == 'string') { _where = JSON.parse(_where); }
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.select({
                        table: 'zn_workflow_stock_sale_receipt_products',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title, product_model',
                            'zn_plugin_stock_convert_warehouse(out_warehouse) as warehouse, out_warehouse'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _customer!=null?" and customer_id=" + _customer:'',
                            _status!=null?' and status=' + _status:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'asc' }
                    })).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "销售订单";
                            _sheet0.data[0] = [
                                '订单状态', '操作时间', '订单编号', '商品名称', '数量',
                                '单价', '总额', '客户名称', '收货人', '收货人手机', '详细地址', '出库仓', '快递公司', '快递单号', '快递费', '快递状态', '备注'
                            ];
                            var _status = '', _express_state = '';
                            var _count = 0, _total_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.total_sum;
                                switch (item.status) {
                                    case 1:
                                        _status = '订单正常';
                                        break;
                                    case -1:
                                        _status = '售后处理中...';
                                        break;
                                    case -2:
                                        _status = '售后处理已完成';
                                        break;
                                }
                                switch (item.express_state) {
                                    case -1:
                                        _express_state = '暂无数据'; break;
                                    case 0:
                                        _express_state = '在途'; break;
                                    case 1:
                                        _express_state = '揽件'; break;
                                    case 2:
                                        _express_state = '疑难'; break;
                                    case 3:
                                        _express_state = '签收'; break;
                                    case 4:
                                        _express_state = '退签'; break;
                                    case 5:
                                        _express_state = '派件'; break;
                                    case 6:
                                        _express_state = '退回'; break;
                                }
                                _sheet0.data.push([
                                    _status,
                                    item.zn_create_time,
                                    item.order_code,
                                    item.product_model,
                                    item.count,
                                    item.price.toFixed(2),
                                    item.total_sum.toFixed(2),
                                    item.customer,
                                    item.consignee,
                                    item.consignee_telephone,
                                    item.address,
                                    item.warehouse,
                                    item.express_company,
                                    item.express_code,
                                    item.express_sum,
                                    _express_state,
                                    item.remark
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '', '', '', _count, '', _total_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("销售单据汇总") + '.xlsx'
                            });
                            _xlsx.generate(response._serverResponse);
                        }, function (err) {
                            response.error(err);
                        });
                }
            },
            getProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _wfinstance = request.getInt('wfinstance'),
                        _values = request.getValue(),
                        _where = _values.where || {};
                    if(_wfinstance){
                        _where.zn_plugin_workflow_instance_id = _wfinstance;
                    }

                    _values.where = _where;
                    _values.table = 'zn_workflow_stock_sale_receipt_products';
                    _values.fields = '*, zn_plugin_stock_convert_product_model(product_model) as product_title, product_model';
                    _values.pageIndex = request.getValue('pageIndex');
                    _values.pageSize = request.getValue('pageSize');
                    this.query(zn.sql.paging(_values)).then(function (data){
                        response.success(data);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            downloadProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _wfinstance = request.getInt('wfinstance'),
                        _values = request.getValue(),
                        _where = _values.where || {};
                    if(typeof _where == 'string') { _where = JSON.parse(_where); }
                    if(_wfinstance){
                        _where.zn_plugin_workflow_instance_id = _wfinstance;
                    }

                    _values.where = _where;
                    _values.table = 'zn_workflow_stock_sale_receipt_products';
                    _values.fields = '*, zn_plugin_stock_convert_product_model(product_model) as product_title, product_model';
                    _values.order = { zn_create_time: 'asc' };
                    _values.pageIndex = request.getValue('pageIndex');
                    _values.pageSize = request.getValue('pageSize');
                    this.query(zn.sql.select(_values)).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "销售订单";
                            _sheet0.data[0] = [
                                    '订单状态', '订单编号', '系统订单号', '商品名称', '数量',
                                    '单价', '总额', '客户名称', '收货人', '详细地址', '收货人手机',
                                    '收货人联系方式', '快递公司', '快递单号', '快递费', '快递状态', '备注'
                            ];
                            var _status = '', _express_state = '';
                            var _count = 0, _total_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.total_sum;
                                switch (item.status) {
                                    case 1:
                                        _status = '订单正常';
                                        break;
                                    case -1:
                                        _status = '售后处理中...';
                                        break;
                                    case -2:
                                        _status = '售后处理已完成';
                                        break;
                                }
                                switch (item.express_state) {
                                    case -1:
                                        _express_state = '暂无数据'; break;
                                    case 0:
                                        _express_state = '在途'; break;
                                    case 1:
                                        _express_state = '揽件'; break;
                                    case 2:
                                        _express_state = '疑难'; break;
                                    case 3:
                                        _express_state = '签收'; break;
                                    case 4:
                                        _express_state = '退签'; break;
                                    case 5:
                                        _express_state = '派件'; break;
                                    case 6:
                                        _express_state = '退回'; break;
                                }
                                _sheet0.data.push([
                                    _status,
                                    item.order_code,
                                    item.sys_order_code,
                                    item.product_model,
                                    item.count,
                                    item.price.toFixed(2),
                                    item.total_sum.toFixed(2),
                                    item.customer,
                                    item.consignee,
                                    item.address,
                                    item.consignee_phone,
                                    item.consignee_telephone,
                                    item.express_company,
                                    item.express_code,
                                    item.express_sum,
                                    _express_state,
                                    item.zn_note
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '', '', '', _count, '', _total_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("销售单据汇总") + '.xlsx'
                            });
                            _xlsx.generate(response._serverResponse);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            pagingSaleServices: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _customer = request.getValue("customer_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.paging({
                        table: 'zn_workflow_stock_sale_service',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title',
                            'zn_chunrui_oa_convert_supplier(supplier_id) as supplier',
                            'zn_chunrui_oa_convert_customer(customer_id) as customer'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _supplier!=null?" and supplier_id=" + _supplier:'',
                            _customer!=null?" and customer_id=" + _customer:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'desc' },
                        pageIndex: request.getValue('pageIndex'),
                        pageSize: request.getValue('pageSize')
                    })).then(function (data){
                            response.success(data);
                        }, function (err) {
                            response.error(err);
                        });
                }
            },
            downloadSaleServices: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _customer = request.getValue("customer_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    if(typeof _where == 'string') { _where = JSON.parse(_where); }
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.select({
                        table: 'zn_workflow_stock_sale_service',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title',
                            'zn_chunrui_oa_convert_supplier(supplier_id) as supplier',
                            'zn_chunrui_oa_convert_customer(customer_id) as customer'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _supplier!=null?" and supplier_id=" + _supplier:'',
                            _customer!=null?" and customer_id=" + _customer:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'asc' }
                    })).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "售后订单单据";
                            _sheet0.data[0] = [
                                '客户', '供应商', '订单编号',
                                '商品名称', '收货人', '详细地址',
                                '收货人手机',
                                '数量', '单价', '总价',
                                '快递公司', '快递单号', '快递金额',
                                '问题描述', '售后费用', '处理结果'
                            ];
                            var _count = 0, _total_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.total_sum;
                                _sheet0.data.push([
                                    item.customer, item.supplier, item.order_code,
                                    item.product_title, item.consignee, item.address,
                                    item.consignee_telephone,
                                    item.count, item.price.toFixed(2), item.total_sum.toFixed(2),
                                    item.express_company, item.express_code, item.express_sum,
                                    item.issue_detail, item.issue_amount, item.issue_result
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '','','','','','','', _count, '', _total_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("售后订单单据") + '.xlsx'
                            });
                            _xlsx.generate(response._serverResponse);
                        }, function (err) {
                            response.error(err);
                        });
                }
            },
            pagingOtherSaleServices: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _customer = request.getValue("customer_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.paging({
                        table: 'zn_workflow_stock_sale_service_other',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title',
                            'zn_chunrui_oa_convert_supplier(supplier_id) as supplier',
                            'zn_chunrui_oa_convert_customer(customer_id) as customer'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _supplier!=null?" and supplier_id=" + _supplier:'',
                            _customer!=null?" and customer_id=" + _customer:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'desc' },
                        pageIndex: request.getValue('pageIndex'),
                        pageSize: request.getValue('pageSize')
                    })).then(function (data){
                            response.success(data);
                        }, function (err) {
                            response.error(err);
                        });
                }
            },
            downloadOtherSaleServices: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _customer = request.getValue("customer_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    if(typeof _where == 'string') { _where = JSON.parse(_where); }
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.select({
                        table: 'zn_workflow_stock_sale_service_other',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title',
                            'zn_chunrui_oa_convert_supplier(supplier_id) as supplier',
                            'zn_chunrui_oa_convert_customer(customer_id) as customer'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _supplier!=null?" and supplier_id=" + _supplier:'',
                            _customer!=null?" and customer_id=" + _customer:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'asc' }
                    })).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "售后订单单据";
                            _sheet0.data[0] = [
                                '客户', '供应商', '订单编号',
                                '商品名称', '收货人', '详细地址',
                                '收货人手机',
                                '数量', '单价', '总价',
                                '快递公司', '快递单号', '快递金额',
                                '问题描述', '售后费用', '处理结果'
                            ];
                            var _count = 0, _total_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.total_sum;
                                _sheet0.data.push([
                                    item.customer, item.supplier, item.order_code,
                                    item.product_title, item.consignee, item.address,
                                    item.consignee_telephone,
                                    item.count, item.price.toFixed(2), item.total_sum.toFixed(2),
                                    item.express_company, item.express_code, item.express_sum,
                                    item.issue_detail, item.issue_amount, item.issue_result
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '','','','','','','', _count, '', _total_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("售后订单单据") + '.xlsx'
                            });
                            _xlsx.generate(response._serverResponse);
                        }, function (err) {
                            response.error(err);
                        });
                }
            }
        }
    });

});
