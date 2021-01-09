require('./CustomerProductQuote.less');
var React = require('react');
var Product = React.createClass({
	getInitialState: function (){
		return {
			active: false
		}
	},
	render: function () {
		var item = this.props.data;
		return (
			<li className="product">
				<div className="title">
					<span onClick={()=>this.setState({active: !this.state.active})}><i className={"fa zr-padding-3 fa-" + (this.state.active?'angle-down':'angle-right')} />{item.zn_title + " " + item.model}</span>
					{this.props.toolbar}
				</div>
				<div className="details" style={{display:(this.state.active?'block':'none')}}>
					<div className="group">
						<div>包装尺寸： {item.package_size}</div>
						<div>净重： {item.net_weight}/KG</div>
					</div>
					{this.props.price || <div className="group">
						<div>可设置单价区间： ￥{(item.min_price||0).toFixed(2)} - ￥{(item.max_price||0).toFixed(2)}</div>
						<div>平均单价： ￥{(item.average_price||0).toFixed(2)}</div>
						<div>销售单价： ￥{(item.sale_price||0).toFixed(2)}</div>
						<div>物流单价： ￥{(item.express_price||0).toFixed(2)}</div>
					</div>}
				</div>
			</li>
		);
	}
});

module.exports = React.createClass({
	getInitialState: function () {
		return {
			model: 'ChunRuiOACustomerProductQuote',
			selected: [],
			selected_sources: [],
			all: [],
			all_sources: []
		}
	},
	componentDidMount: function (){
		this.__loadData();
	},
	__loadData: function (){
		zn.preloader.open({
			title: '正在加载中...'
		});
		zn.http.post('/oa/quote/customer_products', {
			customer: this.props.customer
		}).then(function (data){
			zn.preloader.close();
			if(data.status==200){
				data.result.all_sources = data.result.all;
				data.result.selected_sources = data.result.selected;
				this.setState(data.result);
			}else {
				zn.notification.error(data.result);
			}
		}.bind(this), function (){
			zn.preloader.close();
			zn.notification.error('加载失败');
		});
	},
	__addProductQuote: function (product){
		zn.dialog({
			title: '添加报价',
			content: <zn.react.Form
				className="form"
				action='/zn.plugin.admin/model/insert'
				exts={{model: this.state.model }}
				hiddens={{ product_model: product.model, customer_id: this.props.customer }}
				merge="values"
				onSubmitSuccess={()=>this.__loadData()}
				items={[
					{ title: '销售单价', name: 'price', value: product.sale_price, suffix: '￥', type: 'Input', attrs: { type: 'number' } },
					{ title: '物流单价', name: 'express_price', value: product.express_price, suffix: '￥', type: 'Input', attrs: { type: 'number' }  }
				]} />
		});
	},
	__updatePrice: function (data){
		zn.dialog({
			title: '更新价格',
			content: <zn.react.Form
				action='/zn.plugin.admin/model/update'
				exts={{model: this.state.model, where: { id: data.quote_id }}}
				merge="updates"
				onSubmitSuccess={()=>this.__loadData()}
				items={[
					{ title: '销售单价', name: 'price', value: data.quote_price, suffix: '￥', type: 'Input', attrs: { type: 'number' } },
					{ title: '物流单价', name: 'express_price', value: data.quote_express_price, suffix: '￥', type: 'Input', attrs: { type: 'number' }  }
				]} />
		});
	},
	__removePrice: function (value){
		var _self = this;
		zn.confirm('确定删除该数据吗？','提示', function (){
			zn.http.post('/zn.plugin.admin/model/delete', {
				model: _self.state.model,
				where: {
					id: value.quote_id
				}
			}).then(function (data){
				zn.notification.success('删除成功！');
				_self.__loadData();
			});
		});
	},
	__clearQuotes: function (){
		var _self = this;
		zn.preloader.open({title: '清空中...'});
		zn.confirm('清空报价数据吗？','提示', function (){
			zn.http.post('/oa/quote/init_quotes', {
				type: "customer",
				value: _self.props.customer
			}).then(function (data){
				zn.preloader.close();
				zn.notification.success('清空成功！');
				_self.__loadData();
			});
		});
	},
	searchAll: function (name){
        this.state.all = this.state.all_sources.slice(0).filter(function (item, index){
            if(item.model.toLocaleLowerCase().indexOf(name.toLocaleLowerCase())!=-1 || item.zn_title.toLocaleLowerCase().indexOf(name.toLocaleLowerCase())!=-1){
                return true;
            }
        });
        this.forceUpdate();
    },
	__onSearchKeyUp: function(event){
        var _event = event.nativeEvent;
        if(_event.keyCode==13){
            var _value = _event.target.value;
            this.searchAll(_value);
        }
    },
    __onSearchChange: function (event){
        var _event = event.nativeEvent;
        if(!_event.target.value){
            this.searchAll('');
        }
    },
	searchSelected: function (name){
        this.state.selected = this.state.selected_sources.slice(0).filter(function (item, index){
            if(item.model.toLocaleLowerCase().indexOf(name.toLocaleLowerCase())!=-1 || item.zn_title.toLocaleLowerCase().indexOf(name.toLocaleLowerCase())!=-1){
                return true;
            }
        });
        this.forceUpdate();
    },
	__onSearchKeyUp2: function(event){
        var _event = event.nativeEvent;
        if(_event.keyCode==13){
            var _value = _event.target.value;
            this.searchSelected(_value);
        }
    },
    __onSearchChange2: function (event){
        var _event = event.nativeEvent;
        if(!_event.target.value){
            this.searchSelected('');
        }
    },
	__initQuote: function (){
		zn.dialog({
			title: '一键初始化报价',
			content: <div>
					<div className="zn-note" style={{margin: 6, backgroundColor: 'yellow', color: 'red'}}>注：一键初始化将会清空原有报价数据。</div>
					<zn.react.Form
						action='/oa/quote/init_customer_quote'
						exts={{ customer: this.props.customer }}
						onSubmitSuccess={()=>this.__loadData()}
						items={[
							{ title: '基准价', name: 'price_field', type: 'Select', data: [
								{ text: '平均价', value: 'average_price' },
								{ text: '销售单价', value: 'sale_price' },
								{ text: '最低价', value: 'min_price' },
								{ text: '最高价', value: 'max_price' }
							] }
						]} />
			</div>
		});
	},
	render:function(){
		return (
			<div className="oa-customer-product-quote">
				<div className="quote-left">
					<div className="header">
						<span>[ {this.state.all.length}个 ] 没单价商品</span>
						<div className="searcher">
							<input placeholder="根据型号查询" onChange={(event)=>this.__onSearchChange(event)} onKeyUp={(event)=>this.__onSearchKeyUp(event)} className="search-input" type="search" name="search" />
							<i className="fa fa-search" />
						</div>
					</div>
					<ul className="content products">
						{
							this.state.all.map(function (item){
								return <Product data={item} toolbar={<div>
									<span onClick={()=>this.__addProductQuote(item)} className="zr-tag"><i className="fa fa-plus zr-padding-3" />添加报价</span>
								</div>} />;
							}.bind(this))
						}
					</ul>
				</div>
				<div className="quote-right">
					<div className="header">
						<span>
							[ {this.state.selected.length}个 ]单价商品
							<i className="zr-tag primary fa fa-gear zr-margin-3" onClick={()=>this.__initQuote()} >初始化报价</i>
							<i className="zr-tag primary fa fa-trash zr-margin-3" onClick={()=>this.__clearQuotes()} >清空报价</i>
						</span>
						<div className="searcher">
							<input placeholder="根据型号查询" onChange={(event)=>this.__onSearchChange2(event)} onKeyUp={(event)=>this.__onSearchKeyUp2(event)} className="search-input" type="search" name="search" />
							<i className="fa fa-search" />
						</div>
					</div>
					<ul className="content products">
						{
							this.state.selected.map(function (item){
								return <Product data={item}
										toolbar={<div>
											<span className="zr-tag" onClick={()=>this.__updatePrice(item)}><i className="fa fa-edit zr-padding-3" />修改单价</span>
											<span className="zr-tag danger" onClick={()=>this.__removePrice(item)}><i className="fa fa-trash zr-padding-3" />删除单价</span>
										</div>}
										price={
											<div className="group">
												<div>可设置单价区间： ￥{(item.min_price||0).toFixed(2)} - ￥{(item.max_price||0).toFixed(2)}</div>
												<div>平均单价： ￥{(item.average_price||0).toFixed(2)}</div>
												<div style={{color: '#F44336', fontWeight: 'bold'}}>
													销售单价：￥{(item.quote_price || item.sale_price||0).toFixed(2)} / <span style={{textDecoration: 'line-through', color: '#CCC'}}>￥{(item.sale_price||0).toFixed(2)}</span>
												</div>
												<div style={{color: '#F44336', fontWeight: 'bold'}}>
													物流单价： ￥{(item.quote_express_price || item.express_code||0).toFixed(2)} / <span style={{textDecoration: 'line-through', color: '#CCC'}}>￥{(item.express_code||0).toFixed(2)}</span>
												</div>
											</div>
										} />;
							}.bind(this))
						}
					</ul>
				</div>
			</div>
		);
	}
});
