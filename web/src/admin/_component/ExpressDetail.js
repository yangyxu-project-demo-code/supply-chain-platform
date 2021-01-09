require('./ExpressDetail.less');
var React = require('react');
var ReactDOM = require('react-dom');

module.exports = React.createClass({
	displayName:'ExpressDetail',
	render: function(){
		var _data = this.props.track_data.data.slice(0).sort(function (m, n){
			return (new Date(m.datetime)).getTime() - (new Date(n.datetime)).getTime();
		});
		return (
			<div className={zn.react.classname("zr-express-detail", this.props.className)}>
				{
					_data.map(function (item, index){
						return <ul className="detail-item">
							<li className="time">{item.datetime}</li>
							<li className="dot"></li>
							<li className="context">{item.info}</li>
						</ul>
					})
				}
			</div>
		);
	}
});