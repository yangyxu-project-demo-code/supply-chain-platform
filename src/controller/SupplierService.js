zn.define(function (){

    var node_officegen = require('officegen'),
        node_xlsx = require('xlsx');

    return zn.Controller('supplier_service', {
        methods: {
            pagingServiceBacks: {
                method: 'GET/POST',
                argv: {
                    supplier_id: null
                },
                value: function (request, response, chain){
                    var _supplier = request.getValue("supplier_id"),
                        _status = request.getValue('status'),
                        _begin = request.getValue('begin'),
                        _end = request.getValue('end'),
                        _where = request.getValue('where');
                    this.beginTransaction()
                        .query('paging data', function (){
                            return zn.sql.paging({
                                table: 'zn_chunrui_oa_supplier_service_back',
                                fields: [
                                    '*',
                                    'zn_chunrui_oa_convert_customer(customer_id) as customer',
                                    'zn_plugin_stock_convert_product_model(product_model) as product_title'
                                ],
                                where: [
                                    "zn_deleted=0" + (_where?(' and ' + zn.db.schema.SchemaSqlParser.parseWhere(_where, false)):''),
                                    _supplier!=null?" and supplier_id=" + _supplier:'',
                                    _status!=null?" and status=" + _status:'',
                                    _begin!=null?" and UNIX_TIMESTAMP('"+_begin+"')<UNIX_TIMESTAMP(zn_create_time)":'',
                                    _end!=null?" and UNIX_TIMESTAMP('"+_end+"')>UNIX_TIMESTAMP(zn_create_time)":''
                                ],
                                order: { zn_create_time: 'desc' },
                                pageIndex: request.getValue('pageIndex'),
                                pageSize: request.getValue('pageSize')
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
            }
        }
    });

});
