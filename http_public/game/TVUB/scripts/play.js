//typeof(TVUB) === 'undefined' ? TVUB = {} : '';

$(function () {
	TN_POPUP.show('Đang kết nối với máy chủ...','Kết nối',null,null,null,false);
	var g;
	var accept_connect = true;
	var is_end_game = false;
	if(!window.TVUB) window.TVUB={};
	// var socket = io(window.socket_exam);
	var socket = io();
	socket.on('connect', function(){
		TN_POPUP.hide();
	});

	socket.on('server-ready', function(data,callback){
		console.log(data);
		callback({'client-ready': true,width:screen.width,height:screen.height});
	});

	socket.on('server-msg', function(data){
		console.log(data);
		accept_connect = false;
		TN_POPUP.show(data.message);
	});

	socket.on('socket-ready', function(data){
		if(data.error==0){
			if(g==undefined){
				Init_Game(function(game){
					g = game;
					if (typeof userInfo !== 'undefined') {
						game.provide('user', userInfo);
					}
					game.provide('submitAnswer', function (callback, index, val) {
						socket.emit('submitAnswer', {answer:val,index:index},function(mess){
							callback({result:mess});
						});
					});

					// game.on('setData', function (data) {
					// 	console.log(data);
					// });

					game.on('click.startGame', function () {
						socket.emit('getdata', {a:'mvt',b:'2015'},function(mess){
							//console.log(mess);
							if(mess.error==0){
								// var data = mess.data;
								// var content=data.content;
								// for(var i=0;i<content.length;i++){
								// 	for(var j=0;j<content[i].length;j++){
								// 		if(content[i][j].type=='latex'){
								// 			content[i][j].type='image';
								// 			var src = '/latex/' + encodeURI(content[i][j].content.replace(/\$/g,''));
								// 			content[i][j].content=src;
								// 		}
								// 	}
								// }
								// g.setGameData(data);

								setData(mess.data);
								game.goState('Game');
							}
							else{
								TN_POPUP.show(mess.message);
							}
						});
					});

					game.on('error', function (data) {
						console.log(data);
					});

					game.on('click.endGame', function (data) {
						console.log(data);
					});

					game.on('must-finish', function (data) {
						// console.log('must-finish',data);
						//khi game xong client sẽ bắn fire báo cần kết thúc game
						//cái này có thể dùng hoặc không
						// data.action: timeup, done (hết giờ, hoàn thành bài)
						is_end_game = true;
						socket.emit('onEnd', data,function(mess){
							// console.log(mess);
						});
					});

					game.on('state', function (data) {
						if (data.state === 'End') {
							data.button.hide = false;
							//thi_tiep, thi_lai, dong_y
							data.button.type = 'thi_tiep';
							data.button.callback = function (options) {
								// socket.emit('onEnd', options,function(mess){
								// 	console.log(mess);
								// });
								// if(game.pass_round){
									window.location.href = game.next_url;
								// }
								// else{
								// 	var bottons = [
								// 		{
								// 			caption:'Thi lại',
								// 			callback:function(){
								// 				window.location.href='/';
								// 			}
								// 		},
								// 		{
								// 			caption:'Thoát',
								// 			callback:function(){
								// 				window.location.href='bai-1';
								// 			}
								// 		}
								// 	];
								// 	TN_POPUP.show('Bạn chưa đủ điểm để qua vòng<br/>Bạn có muốn thi lại vòng này không?',null,null,null,bottons,null,false);
								// }
							}
						}
					});
				});
			}
		}
		else{
			accept_connect = false;
			TN_POPUP.show(data.error_message,'Cảnh báo',null,null,null,null,false);
			socket.close();
		}
	});

	function setData(data){
		var content=data.content;
		for(var i=0;i<content.length;i++){
			for(var j=0;j<content[i].length;j++){
				if(content[i][j].type=='latex'){
					content[i][j].type='image';
					var src = '/latex/' + encodeURI(content[i][j].content.replace(/\$/g,''));
					content[i][j].content=src;
				}
			}
		}
		g.setGameData(data);
	}

	socket.on('onData', function(mess){
		if(mess.error==0){
			//g.setGameData(mess.data);
			setData(mess.data);
		}
		else{
			TN_POPUP.show(mess.message);
		}
	});

	socket.on('onStart', function(){
		g.goState('Game');
	});

	socket.on('onEnd', function(mess){
		// console.log(mess);
		is_end_game = true;
		var data_endgame = {
			score: mess.score,
			timeLeft: mess.timeLeft,
			time: mess.time
		}
		g.goState('End',data_endgame);

		if(mess.data_round){
			var data_round = mess.data_round;
			var html = '';
			if(data_round.luot>1) html +='Lượt thi: ' + data_round.luot + '<br/>';
			html += 'Tỗng điểm: ' + data_round.total_score + '<br/>';
			html += 'Tỗng thời gian: ' + data_round.total_time + '<br/>';
			if(data_round.round_info && data_round.round_info.length>0){
				var round_info = mess.data_round.round_info;
				for(i=0;i<round_info.length;i++){
					html += 'Bài: ' + (i+1) + '- Điểm: ' + round_info[i].score + ' - Thời gian: ' + round_info[i].total_time + '<br/>';
				}
			}

			var bottons = [];
			if(mess.pass_round){
				bottons.push({
					caption:'Thi tiếp',
					callback:function(){
						window.location.href='../vong-' + (mess.round_id + 1) + '/bai-1';
					}
				});
				html += '(Bạn được thi vòng tiếp theo)';
			}
			else{
				bottons.push({
					caption:'Thi lại',
					callback:function(){
						window.location.href='bai-1';
					}
				});
				html += '(Bạn chưa qua vòng này)';
			}
			bottons.push({
				caption:'Thoát',
				callback:function(){
					window.location.href='/';
				}
			});
			TN_POPUP.show(html,'Thông tin vòng thi ' + mess.round_id,400,280,bottons,null,false);
		}
		else{
			g.pass_round = mess.pass_round;
			g.next_url = mess.next_url;
		}
	});

	socket.on('disconnect', function(){
		if(accept_connect && !is_end_game) TN_POPUP.show('Đã ngắt kết nối với máy chủ...','Lỗi kết nối',null,null,null,null,false);
	});

	function Init_Game(callback){
		var Game = IGame.core;
		new Game({
			container: '#tn-game',
			baseUrl: '/game/TVUB/',
			states: [{
				name: 'Boot',
				state: TVUB.Boot
			}, {
				name: 'Preload',
				state: TVUB.Preload
			}, {
				name: 'Home',
				state: TVUB.Home
			}, {
				name: 'Game',
				state: TVUB.Game
			}, {
				name: 'End',
				state: TVUB.End
			}],
			message: {
				rule: 'Em hãy giúp Trâu vàng điền chữ cái, từ, số, ký hiệu toán học hoặc phép tính phù hợp vào ô trống còn thiếu.'
			},
			sound: true,
			autoLoad: true,
			ready: function (game) {
				game.off('boot');
				callback(game);
			}
		});
	}
});