/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(".setting-val").slider();


/*
 * object - オブジェクトを作る
 * Object object(BaseObj [, mixinObj1 [, mixinObj2...]])
 */
function object(o) {
  var f = object.f, i, len, n, prop;
  f.prototype = o;
  n = new f;
  for (i=1, len=arguments.length; i<len; ++i)
    for (prop in arguments[i])
      n[prop] = arguments[i][prop];
  return n;
}
object.f = function(){};


function AjaxSetup() {
    var AjaxRequest = {
        init: function(url, requestType, dataType, callback) {
            this.url = url;
            this.requestType = requestType;
            this.dataType = dataType;
            this.callback = callback;
        },
        exec: function(data) {
            $.ajax({
                url: this.url,
                type: this.requestType,
                data: data,
                dataType: this.dataType
            }).done(this.callback).fail(function() {
                alert('fail');
              //失敗
            });
        }
    };
    return AjaxRequest;
}


// Open Weather Map API呼び出し
function get_weather(latitude, longitude, address, result_notify) {
    var api_key, send_data, url_get_weather, ajax_get_weather, callback_get_weather;
    
    callback_get_weather = function(response) {
        if (response.cod == 200) {
            var weather = "不明";
            var temp = response.main.temp;
            var hum = response.main.humidity;
            switch (response.weather[0].id) {
                case 200:
                case 201:
                case 202:
                case 210:
                case 211:
                case 212:
                case 221:
                case 230:
                case 231:
                case 232:
                    weather = "雷雨";
                    break;
                case 300:
                case 301:
                case 302:
                case 310:
                case 311:
                case 312:
                case 313:
                case 314:
                case 321:
                    weather = "霧雨";
                    break;
                case 500:
                case 501:
                case 502:
                case 503:
                case 504:
                case 511:
                case 520:
                case 521:
                case 522:
                case 531:
                    weather = "雨";
                    break;
                case 600:
                case 601:
                case 602:
                case 611:
                case 612:
                case 615:
                case 616:
                case 620:
                case 621:
                case 622:
                    weather = "雪";
                    break;
                case 800:
                    weather = "晴れ";
                    break;
                case 801:
                case 802:
                case 803:
                case 804:
                    weather = "曇り";
                    break;
                default :
                    break;
            }

            result_notify(address, weather, temp, hum);
        } else {
            alert("失敗")
        }
    };
    
    url_get_weather = 'http://api.openweathermap.org/data/2.5/weather';
    api_key = '0dc0554964dc81b7a28ff0e344065c0a';
    ajax_get_weather = object(AjaxSetup());
    ajax_get_weather.init(url_get_weather, 'GET', 'json', callback_get_weather);
    send_data = {
        APPID: api_key,
        lat: String(latitude),
        lon: String(longitude),
        units: "metric"
    };
    ajax_get_weather.exec(send_data);
}


//Google geocode API呼び出し
function geocode(address, result_notify) {
    var api_key, send_data, url_geocode, ajax_geocode, callback_geocode;
    
    callback_geocode = function(response) {
        var result = response.results[0], address = '', country = '', latitude, longitude;

        for (i = result.address_components.length - 1; i >= 0; i--) {
            for (j = 0; j < result.address_components[i].types.length; j++) {
                if (result.address_components[i].types[j].indexOf("country") != -1) {
                    country = result.address_components[i].long_name;
                } else if (result.address_components[i].types[j].indexOf("sublocality") != -1) {
                    break;
                } else if (result.address_components[i].types[j].indexOf("administrative_area_level") != -1 ||
                           result.address_components[i].types[j].indexOf("locality") != -1) {
                    address += result.address_components[i].long_name;
                }
            }
        }

	if (address == "") {
           address += " " + country; //ちょっとくどいので省略
	}
        latitude = result.geometry.location.lat;
        longitude = result.geometry.location.lng;
        
        get_weather(latitude, longitude, address, result_notify);
    };
    
    url_geocode = 'https://maps.googleapis.com/maps/api/geocode/json?json';
    api_key = 'AIzaSyD_OKd0zdNvwtSziU9Ocv6pYQGoFNCBQJ8';
    ajax_geocode = object(AjaxSetup());
    ajax_geocode.init(url_geocode, 'GET', 'json', callback_geocode);
    send_data = {
        key: api_key,
        address: address,
        language: "ja"
    };
    ajax_geocode.exec(send_data);
}


//yahooの構文解析API呼び出し
function text_parse(text_data, result_notify) {
    var api_key, send_data, url_text_parse, ajax_text_parse, callback_text_parse, address;

    callback_text_parse = function(response) {
      htmlDoc = $.parseHTML(response.results[0]);
      var parseResult = [];
      $(htmlDoc).find("word").each(function() {
          if ($(this).find("pos").text() == "名詞" ||
              ($(this).find("pos").text() =="接尾辞" && $(this).find("surface").text() == "駅")) {
              parseResult.push($(this).find("surface").text());
          }
      });

      address = '';
      for (var i = 0; i < parseResult.length; i++) {
          if (parseResult[i] != "天気") {
              address += parseResult[i];
          } else {
              break;
          }
      }

      geocode(address, result_notify);
    };

    url_text_parse = 'http://jlp.yahooapis.jp/MAService/V1/parse';
    api_key = 'dj0zaiZpPWZYaGxETmRTY3lQcSZzPWNvbnN1bWVyc2VjcmV0Jng9ZmQ-';
    ajax_text_parse = object(AjaxSetup());
    ajax_text_parse.init(url_text_parse, 'GET', 'html', callback_text_parse);
    send_data = {
        appid: api_key,
        sentence: text_data
    };
    ajax_text_parse.exec(send_data);
}


function start_get_weather_data(text_data, result_notify) {
    text_parse(text_data, result_notify);
}


function SpeechRecognitionSetup() {
    var SpeechRecognition = {
        init: function(obj) {
            this.Speech =  new webkitSpeechRecognition();
            this.Speech.lang = "ja";
            this.Speech.onerror = function(event) {
                //音声認識した結果、エラーとなった場合の処理
                console.log('error');
            };
            
            this.Speech.onnomatch = function(event) {
                alert('nomatch')  
            };
            
            this.Speech.onend = function(event) {
                //音声認識終了時の処理
                $('#rec-audio').get(0).play();
            };
          
            if (obj == undefined) {
                return 0;
            }
            
            for(var key in obj) {
                switch (key) {
                    case 'onerror':
                        this.Speech.onerror = obj[key];
                        break;
                    case 'onnomatch':
                        this.Speech.onnomatch = obj[key];
                        break;
                    case 'onend':
                        this.Speech.onend = obj[key];
                        break;
                }
            }
        },
        exec: function(result) {
            this.Speech.onresult = result;
            this.Speech.start();
            $('#rec-audio').get(0).play();
        }
    };
    return SpeechRecognition;
}


function start_speech_recognition(result_func, init_param) {
    var speech = object(SpeechRecognitionSetup());
    if (init_param == undefined) {
        speech.init();
    } else {
        speech.init(init_param);
    }
    speech.exec(result_func);
}


function SpeechSynthesisUtteranceSetup() {
    var SynthesisUtterance = {
        init: function(obj) {
            this.Speech =  new SpeechSynthesisUtterance();
            this.Speech.lang = "ja-JP";
            this.Speech.volume = $('#generic-volume').val();
            this.Speech.rate = $('#generic-rate').val();
            this.Speech.pitch = $('#generic-pitch').val();
            
            if (obj == undefined) {
                return 0;
            }
            
            for(var key in obj) {
                switch (key) {
                    case 'lang':
                         this.Speech.lang = obj[key];
                        break;
                    case 'volume':
                         this.Speech.volume = obj[key];
                        break;
                    case 'rate':
                         this.Speech.rate = obj[key];
                        break;
                    case 'pitch':
                         this.Speech.pitch = obj[key];
                        break;
                }
            }
        },
        exec: function(text) {
            speechSynthesis.cancel();
            this.Speech.text = text;
            speechSynthesis.speak(this.Speech);
        }
    };
    return SynthesisUtterance;
}


function start_speech_synthesis(text) {
    var speech = object(SpeechSynthesisUtteranceSetup());
    speech.init();
    speech.exec(text);
}


//各種イベント登録
$(document).ready(function() {
    $("#get-weather-test").click(function () {
        var text = $('input[name=location]').val() + 'の天気が知りたい';
        var process = function(address, weather, temp, hum) {
            $('#get-weather-test-result p').remove();
            $('#get-weather-test-result').append('<p>場所：' + address + '</p>');
            $('#get-weather-test-result').append('<p>天気：' + weather + '</p>');
            $('#get-weather-test-result').append('<p>気温：' + temp + '℃</p>');
            $('#get-weather-test-result').append('<p>温度：' + hum + '％</p>');
        };
        
        start_get_weather_data(text, process);
    });
    
    
    $('#speech-recognition-test').click(function() {
        var result_func = function(event) {
            //➁音声認識した結果を得る処理
            // 認識された「言葉」を、変数「text」に格納
            var text = event.results[0][0].transcript;

            // 認識された「言葉(text)」を、表示用のdivタグに代入する
            $('#speech-recognition-test-result').html(text);
        };
        $('#speech-recognition-test-result').html('');
        start_speech_recognition(result_func);
    });
    
    
    $('#speech-test-start').click(function() {
        var text = $('#speech-test-text').val();
        start_speech_synthesis(text);
    });
    
    
    $('#demo-start').click(function() {
        var recognition_result = function(event) {
            var text = event.results[0][0].transcript;
            $('#speech-recognition-result').html(text);
            if (text.match('天気')) {
                var weather_result = function(address, weather, temp, hum){
                    var speech_text = address + 'の天気を検出しました。' + '天気は' + weather + '、気温は' + temp + '度、湿度は' + hum + '％です。';
                    start_speech_synthesis(speech_text);
                };
            start_get_weather_data(text, weather_result);
            } else {
                start_speech_synthesis('何言ってるの？　意味わからん。　きびし医医医'); 
            }
        };
        
        var init_param = {
            onend : function(event) {
                //音声認識した結果、エラーとなった場合の処理
                if ($('#speech-recognition-result').html() == '') {
                    start_speech_synthesis('よく聞き取れませんでした。 きびし医医医'); 
                }
                $('#rec-audio').get(0).play();
            }
        };
        $('#speech-recognition-result').html('');
        start_speech_recognition(recognition_result, init_param);
    });
  
});
