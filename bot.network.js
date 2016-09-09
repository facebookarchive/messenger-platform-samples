
const jsonfile = require('jsonfile')
const request = require("request")

const newsListFile = 'data/news.json'
const newsListURL = "https://www.skytel.mn/api/content/list?category=7&page=1"; 

const newsDetailFile = 'data/news_detail.json'
        
var currentNews = []; 
var currentNewsIds = []; 
function getLatestNews(callbackfn){ 
    var currentLatestId = getLastNewsId();
    console.log("$$$$ currentLatestId: "+currentLatestId);
    request({
        url: newsListURL, 
        json: true
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            var newsList = body.result.newsList;
            
            if(newsList[0].id > currentLatestId){
                console.log("$$$$ new news found: "+newsList[0].id);
                var errorlog; 
                jsonfile.writeFileSync(newsListFile, newsList, errorlog); 
                    console.error("$$$ options in writing file: "+errorlog);
                
                for(var i in newsList){
                    console.log("$$$$ saving news detail: "+newsList[i].id);
                    currentNewsIds.push(newsList[i].id);
                }
                
                saveNewsDetail(currentNewsIds); 
            }
        }else{
            console.log("$$$$ getting news list: "+response.statusCode );
        }
        
        var detail = jsonfile.readFileSync(newsDetailFile);
        console.log("$$$$ detail to callback: "+detail );
        callbackfn(detail);
    })
}

module.exports.getLatestNews = getLatestNews;

/**
 * Save the news detail into file 
 * FIXME - Overwriting into the file 4 times! (Bazarvaani!)
 */
var detailCounter = 0; 

function saveNewsDetail(newsIds){
    
    if(detailCounter < 4){
        var newsDetailURL = `https://www.skytel.mn/api/content/${newsIds[detailCounter]}/show`; 
        request({
            url: newsDetailURL,
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                var newsContent = body.result.content;
                currentNews.push(newsContent); 
                var writingErr; 
                jsonfile.writeFileSync(newsDetailFile, currentNews, writingErr);
                console.error("$$$ options in writing file: "+writingErr);

                detailCounter++; 
                saveNewsDetail(newsIds); 
                console.log("$$$$ saved news detail: "+newsContent.id);
            }else{
                console.log("$$$$ getting news detail: "+response.statusCode );
            }
        })
    }
    
}

//Get the id of last news saved in file
function getLastNewsId(){
    var result = jsonfile.readFileSync(newsListFile);
    return result[0].id;
}

