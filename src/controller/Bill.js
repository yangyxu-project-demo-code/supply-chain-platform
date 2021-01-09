zn.define(function (){

    var node_officegen = require('officegen'),
        node_xlsx = require('xlsx');

    return zn.Controller('bill', {
        methods: {
            downloadCustomerBill: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _customer = request.getValue("customer_id"),
                        _state = request.getValue('state'),
                        _begin = request.getValue('begin') || '',
                        _end = request.getValue('end') || '',
                        _where = request.getValue('where');
                    if(typeof _where == 'string') { _where = JSON.parse(_where); }
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.select({
                        table: 'zn_chunrui_oa_customer_bill',
                        fields: [
                            '*',
                            'zn_plugin_admin_convert_user(zn_create_user) as zn_create_user',
                            'zn_chunrui_oa_convert_customer(customer_id) as customer'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _customer!=null?" and customer_id=" + _customer:'',
                            _state!=null?" and state=" + _state:'',
                            _begin ? " and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end ? " and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'asc' }
                    })).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = _begin + '-' + _end + " 账单详情";
                            _sheet0.data[0] = [
                                '流程ID', '金额', '操作类型',
                                '操作时间', '操作者', '说明'
                            ];
                        var _total_sum = 0;
                        data.forEach(function (item){
                            _total_sum += item.total_price;
                            _sheet0.data.push([
                                item.instance_id, item.total_price.toFixed(2), (function (state){ switch(state){ case 0: return '扣款'; case 1: return '充值'; case 2: return "退款"; } })(item.state),
                                item.zn_create_time, item.zn_create_user, item.zn_note
                            ]);
                        });
                        _sheet0.data.push(["汇总： ", _total_sum.toFixed(2), '', '', '', '']);
                        response.writeHead(200, {
                            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            'Content-disposition': 'attachment; filename=' + encodeURI(_begin + '-' + _end + "对账单详情") + '.xlsx'
                        });
                        _xlsx.generate(response._serverResponse);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            pagingBills: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _customer = request.getValue("customer_id"),
                        _state = request.getValue('state'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    var _hasWhere = typeof _where=='object'?!!Object.keys(_where).length:_where;
                    this.query(zn.sql.paging({
                        table: 'zn_chunrui_oa_customer_bill',
                        fields: [
                            '*',
                            'zn_plugin_admin_convert_user(zn_create_user) as zn_create_user'
                        ],
                        where: [
                            "zn_deleted=0" + (_hasWhere?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _customer!=null?" and customer_id=" + _customer:'',
                            _state!=null?" and state=" + _state:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'desc', },
                        pageIndex: request.getValue('pageIndex'),
                        pageSize: request.getValue('pageSize')
                    })).then(function (data){
                            response.success(data);
                        }, function (err) {
                            response.error(err);
                        });
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
            getSupplierProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');

                    this.query(zn.sql.paging({
                        table: 'zn_workflow_stock_in_details',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title, zn_chunrui_oa_convert_supplier(supplier_id) as supplier, supplier_id, product_model'
                        ],
                        where: [
                            "zn_deleted=0" + (_where?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                            _supplier!=null?" and supplier_id=" + _supplier:'',
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
            downloadSupplierProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end');

                    this.query(zn.sql.select({
                        table: 'zn_workflow_stock_in_details',
                        fields: [
                            '*',
                            'zn_plugin_stock_convert_product_model(product_model) as product_title, zn_chunrui_oa_convert_supplier(supplier_id) as supplier, supplier_id, product_model'
                        ],
                        where: [
                            "zn_deleted=0",
                            _supplier!=null?" and supplier_id=" + _supplier:'',
                            _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                            _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                        ],
                        order: { zn_create_time: 'desc' }
                    })).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "采购单据";
                            _sheet0.data[0] = [
                                '供应商', '商品名称', '商品型号', '数量', '单价', '总额', '物流金额', '姓名', '电话', '地址', '时间'
                            ];
                            var _count = 0, _total_sum = 0, _total_express_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.amount;
                                _total_express_sum += item.express_sum;
                                _sheet0.data.push([
                                    item.supplier,
                                    item.product_title,
                                    item.product_model,
                                    item.count,
                                    item.price.toFixed(2),
                                    item.amount.toFixed(2),
                                    item.express_sum.toFixed(2),
                                    item.name,
                                    item.phone,
                                    item.address,
                                    item.zn_create_time
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '', '', _count, '', _total_sum.toFixed(2), _total_express_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("采购单据汇总") + '.xlsx'
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
                    _values.table = 'zn_workflow_stock_in_details';
                    _values.fields = '*, zn_plugin_stock_convert_product_model(product_model) as product_title, zn_chunrui_oa_convert_supplier(supplier_id) as supplier, product_model';
                    _values.pageIndex = request.getValue('pageIndex');
                    _values.pageSize = request.getValue('pageSize');
                    _values.order = {zn_create_time:'desc'};
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
                    if(_wfinstance){
                        _where.zn_plugin_workflow_instance_id = _wfinstance;
                    }

                    _values.where = _where;
                    _values.table = 'zn_workflow_stock_in_details';
                    _values.fields = '*, zn_plugin_stock_convert_product_model(product_model) as product_title, zn_chunrui_oa_convert_supplier(supplier_id) as supplier, product_model';
                    _values.order = {zn_create_time:'desc'};
                    this.query(zn.sql.select(_values)).then(function (data){
                        var _xlsx = node_officegen('xlsx'),
                            _sheet0 = _xlsx.makeNewSheet();
                            _sheet0.name = "采购单据";
                            _sheet0.data[0] = [
                                '供应商', '商品名称', '数量', '单价', '总额'
                            ];
                            var _count = 0, _total_sum = 0;
                            data.forEach(function (item){
                                _count += item.count;
                                _total_sum += item.amount;
                                _sheet0.data.push([
                                    item.supplier,
                                    item.product_title,
                                    item.count,
                                    item.price.toFixed(2),
                                    item.amount.toFixed(2)
                                ]);
                            });
                            _sheet0.data.push(["汇总： ", '', _count, '', _total_sum.toFixed(2)]);
                            response.writeHead(200, {
                                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                'Content-disposition': 'attachment; filename=' + encodeURI("采购单据汇总") + '.xlsx'
                            });
                            _xlsx.generate(response._serverResponse);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            getServiceProductList: {
                method: 'GET/POST',
                value: function (request, response, chain){
                    var _wfinstance = request.getInt('wfinstance'),
                        _values = request.getValue(),
                        _where = _values.where || {};
                    if(_wfinstance){
                        _where.zn_plugin_workflow_instance_id = _wfinstance;
                    }

                    _values.where = _where;
                    _values.table = 'zn_workflow_stock_sale_service';
                    _values.fields = '*, zn_plugin_stock_convert_product_model(product_model) as product_title, zn_plugin_stock_convert_product_id(product_serial_number) as product_id';
                    _values.pageIndex = request.getValue('pageIndex');
                    _values.pageSize = request.getValue('pageSize');
                    this.query(zn.sql.paging(_values)).then(function (data){
                        response.success(data);
                    }, function (err) {
                        response.error(err);
                    });
                }
            },
            updateItemCount: {
                method: 'GET/POST',
                argv: {
                    item_id: null
                },
                value: function (request, response, chain){
                    var _item_id = request.getValue('item_id'),
                        _count = request.getInt('count');
                    var _base = null;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_in_details left join zn_workflow_stock_in on zn_workflow_stock_in_details.zn_plugin_workflow_primary_id=zn_workflow_stock_in.id',
                                fields: 'zn_workflow_stock_in_details.*, zn_workflow_stock_in.in_warehouse as in_warehouse',
                                where: "zn_workflow_stock_in_details.id="+_item_id
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0];
                            var _sql = zn.sql.update({
                                table: 'zn_plugin_stock_product_stock',
                                updates: "count=count-" + (_count || _base.count),
                                where: {
                                    product_model: _base.product_model,
                                    warehouse_id: _base.in_warehouse
                                }
                            });
                            if(!_count || (_count && _count == _base.count)) {
                                _sql += zn.sql.delete({
                                    table: 'zn_workflow_stock_in_details',
                                    where: { id: _item_id }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '作废采购单',
                                        warehouse_id: _base.in_warehouse,
                                        product_model: _base.product_model,
                                        number: -(_count || _base.count)
                                    }
                                });
                            }else {
                                _sql += zn.sql.update({
                                    table: 'zn_workflow_stock_in_details',
                                    updates: "count=count-" + _count,
                                    where: { id: _item_id }
                                });
                                _sql += zn.sql.insert({
                                    table: 'zn_plugin_stock_product_stock_log',
                                    values: {
                                        type: '修改采购单数量',
                                        warehouse_id: _base.in_warehouse,
                                        product_model: _base.product_model,
                                        number: -(_count || _base.count)
                                    }
                                });
                            }

                            return _sql;
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            },
            updateItemCountWithoutStock: {
                method: 'GET/POST',
                argv: {
                    item_id: null
                },
                value: function (request, response, chain){
                    var _item_id = request.getValue('item_id'),
                        _count = request.getInt('count');
                    var _base = null;
                    this.beginTransaction()
                        .query("select ticket", function (){
                            return zn.sql.select({
                                table: 'zn_workflow_stock_in_details',
                                where: { id: _item_id }
                            });
                        })
                        .query('validate stock', function (sql, rows){
                            if(!rows[0]){
                                return response.error('为查找到单据'), false;
                            }
                            _base = rows[0];
                            var _sql = '';
                            if(!_count || (_count && _count == _base.count)) {
                                _sql += zn.sql.delete({
                                    table: 'zn_workflow_stock_in_details',
                                    where: { id: _item_id }
                                });
                            }else {
                                _sql += zn.sql.update({
                                    table: 'zn_workflow_stock_in_details',
                                    updates: "count=" + _count,
                                    where: { id: _item_id }
                                });
                            }

                            return _sql;
                        }, function (err, rows){
                            if(err){
                                response.error(err);
                            }else {
                                response.success(rows);
                            }
                        })
                        .commit();
                }
            }
        }
    });

});
