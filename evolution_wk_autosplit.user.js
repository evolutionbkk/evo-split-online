// ==UserScript==
// @name         Evolution — แบ่งลูกค้า Sales(W)/Sales(K) อัตโนมัติ
// @namespace    evo.wk.autosplit
// @version      1.0
// @description  เปิดหน้าลูกค้าปลีกแล้วดึง+กรองเบอร์+แบ่ง W/K ให้อัตโนมัติ เติมเฉพาะรายใหม่ต่อคิว จำต่อเนื่อง พร้อมดาวน์โหลด Excel/CSV
// @match        https://app.evolutionecommerce.co.th/party/customer*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function(){
  'use strict';
  if(window.__evoWK) return; window.__evoWK=true;

  var LS='evoWK_state_v1';
  var API='https://app.evolutionecommerce.co.th:8443/api/person/getPersons/CUSTOMER/find';
  var BASE_DATE='25/07/2569';
  // ===== ตั้งค่าเชื่อมเว็บออนไลน์ (Railway) — ถ้าเว้นว่างจะทำงานเฉพาะในเครื่อง =====
  var SYNC_URL='https://evo-split-online-production.up.railway.app';  // เว็บแอปบน Railway
  var SYNC_KEY='RQrrtZWhNze9_yc7YyA1dvjJZgw';                          // ตรงกับ INGEST_KEY ในเว็บแอป
  var AUTO_REFRESH_MIN=5;   // ดึงซ้ำอัตโนมัติทุก 5 นาที (real-time) ระหว่างเปิดหน้าไว้ (ตั้ง 0 เพื่อปิด)
  var SEED=[{"c": "CTM101299", "n": "260725K2HJEEV4", "p": "0846446415"}, {"c": "CTM101293", "n": "อันนูวาวี ปุยุ", "p": "0222222222"}, {"c": "CTM101290", "n": "260725JVUCKBFB", "p": "0848465166"}, {"c": "CTM101286", "n": "260725JWUS8K24", "p": "0616461633"}, {"c": "CTM101285", "n": "260725JVCU5WSW", "p": "0290844662"}, {"c": "CTM101284", "n": "260725JV8UC6C8", "p": "0905656662"}, {"c": "CTM101282", "n": "260725JW7B2C5K", "p": "0984654946"}, {"c": "CTM101281", "n": "260725JWEF04WN", "p": "0954656663"}, {"c": "CTM101280", "n": "260725JWT5RGQP", "p": "0874946462"}, {"c": "CTM101278", "n": "260725K0K0KPY5", "p": "0846461632"}, {"c": "CTM101277", "n": "260725JYTRCM5E", "p": "0289414641"}, {"c": "CTM101275", "n": "anusorn", "p": "0816299915"}, {"c": "CTM101274", "n": "พวงเพชร หนูเงิน", "p": "0615494529"}, {"c": "CTM101273", "n": "แก้วใจ แม้นเมฆ", "p": "0811930390"}, {"c": "CTM101271", "n": "จันทร์ทิพา ผิวอ่อนดี", "p": "0927563684"}, {"c": "CTM101268", "n": "Saw Kyaw", "p": "0946596700"}, {"c": "CTM101267", "n": "อภินันท์ อันภักดี", "p": "0255345522"}, {"c": "CTM101266", "n": "ศิริวรรณพิณนา", "p": "0810367114"}, {"c": "CTM101263", "n": "อินอร", "p": "0983351456"}, {"c": "CTM101257", "n": "นายสายันต์ ทองเหลือง", "p": "0924032013"}, {"c": "CTM101193", "n": "260725JRE9VP58", "p": "0955659632"}, {"c": "CTM101185", "n": "260724HE6WJAJN", "p": "0987465446"}, {"c": "CTM101183", "n": "260725JR4H43DJ", "p": "0846464221"}, {"c": "CTM101180", "n": "ราเชนทร์ รอยประโคน", "p": "0600000007"}, {"c": "CTM101172", "n": "ทิพวรรณ แห่สถิตย์", "p": "0817748923"}, {"c": "CTM101171", "n": "นางเกวลิน ฮอลแลนด์", "p": "0805634114"}, {"c": "CTM101168", "n": "นางสาวเพ็ญนภา อนุฤทธิ์", "p": "0649890851"}, {"c": "CTM101166", "n": "1117259593888199", "p": "0894646163"}, {"c": "CTM101159", "n": "สิริโสม นวบกำแหง", "p": "0817905229"}, {"c": "CTM101156", "n": "วัชรชัย ไชยดี", "p": "0832420519"}, {"c": "CTM101154", "n": "ศิวนาถ ลอดคูบอน", "p": "0936585435"}, {"c": "CTM101152", "n": "ภรภัทร ยูนิพันธ์", "p": "0615454987"}, {"c": "CTM101149", "n": "1109030256734199", "p": "0844884152"}, {"c": "CTM101142", "n": "ณัฐวิมล คำภริยา", "p": "0878310967"}, {"c": "CTM101138", "n": "มะเหมี่ยว", "p": "0642230768"}, {"c": "CTM101135", "n": "รุ่งนภา ชนะศึก", "p": "0846085088"}, {"c": "CTM101132", "n": "ณัฐฏ์ธนิชน์ ไชยมั่น", "p": "0922648596"}, {"c": "CTM101092", "n": "260725JPQYCWFU", "p": "0956566323"}, {"c": "CTM101084", "n": "260725JKGEAWJC", "p": "0985656533"}, {"c": "CTM101082", "n": "260725JT1K6T8H", "p": "0845454133"}, {"c": "CTM101081", "n": "260725JS5W7YSH", "p": "0656565563"}, {"c": "CTM101075", "n": "260725JND7SRD2", "p": "0656565663"}, {"c": "CTM101073", "n": "260725JSUPBQAH", "p": "0856544413"}, {"c": "CTM101012", "n": "260725JQWD52RG", "p": "0998995663"}, {"c": "CTM100988", "n": "260724H9Y6H4JQ", "p": "0854646463"}, {"c": "CTM100986", "n": "260725HTE3FQWP", "p": "0646461313"}, {"c": "CTM100983", "n": "260725HVR79M4S", "p": "0654164632"}, {"c": "CTM100978", "n": "260725JQ3EFG7A", "p": "0854646566"}, {"c": "CTM100969", "n": "260724GYV1UXUC", "p": "0646416433"}, {"c": "CTM100967", "n": "260725J0B4MGFJ", "p": "0665265332"}, {"c": "CTM100952", "n": "260724H3WVX2YB", "p": "0654613361"}, {"c": "CTM100949", "n": "260724HKHK7EWF", "p": "0655632132"}, {"c": "CTM100948", "n": "260725JEJ8703G", "p": "0646563633"}, {"c": "CTM100941", "n": "260725JJSD319D", "p": "0845465453"}, {"c": "CTM100937", "n": "260725JJ97973V", "p": "0965653323"}, {"c": "CTM100936", "n": "260725JJ15QCAN", "p": "0984656332"}, {"c": "CTM100935", "n": "260725JJENT6GH", "p": "0956532333"}, {"c": "CTM100934", "n": "260725JJW3BS4P", "p": "0804646622"}, {"c": "CTM100931", "n": "260725HUQJ1P66", "p": "0964643254"}, {"c": "CTM100926", "n": "260725HXERGQBX", "p": "0984646462"}, {"c": "CTM100921", "n": "260724H81SWE5B", "p": "0904566663"}, {"c": "CTM100919", "n": "260725JG69902U", "p": "0854542113"}, {"c": "CTM100917", "n": "260725HQD8Y6VB", "p": "0985656532"}, {"c": "CTM100915", "n": "260724HD2F5W2Q", "p": "0984646622"}, {"c": "CTM100910", "n": "260724H7DUYD0Q", "p": "0854654164"}, {"c": "CTM100906", "n": "260725HT6ED353", "p": "0854654632"}, {"c": "CTM100903", "n": "260724HGSQUDK8", "p": "0284054646"}, {"c": "CTM100902", "n": "260725HT0FP0R3", "p": "0985656632"}, {"c": "CTM100898", "n": "260724HKX7HUW2", "p": "0804541544"}, {"c": "CTM100896", "n": "260724H70A0ACT", "p": "0845454522"}, {"c": "CTM100893", "n": "260725HSXDUERP", "p": "0956565666"}, {"c": "CTM100888", "n": "260725JGJ4U6UN", "p": "0985464646"}, {"c": "CTM100886", "n": "260724HJ2BPAR1", "p": "0656526265"}, {"c": "CTM100885", "n": "260724H782W3XP", "p": "0844466565"}, {"c": "CTM100883", "n": "260724HEP4TM54", "p": "0874541585"}, {"c": "CTM100881", "n": "260724GWNXQQ8H", "p": "0985652646"}, {"c": "CTM100878", "n": "260724GN675WJ0", "p": "0985654656"}, {"c": "CTM100877", "n": "260724H2X1GUKJ", "p": "0956545652"}, {"c": "CTM100876", "n": "260724H10XGPJQ", "p": "0905649565"}, {"c": "CTM100875", "n": "260724GRJW6R8Q", "p": "0854144613"}, {"c": "CTM100874", "n": "260724GMDWXGU3", "p": "0841646461"}, {"c": "CTM100873", "n": "260724GMXPV1FB", "p": "0985418846"}, {"c": "CTM100872", "n": "260724GJW5QN0Q", "p": "0854841655"}, {"c": "CTM100869", "n": "260724GTY2TC4U", "p": "0841464646"}, {"c": "CTM100868", "n": "260724GYCTG2W8", "p": "0851654139"}, {"c": "CTM100866", "n": "260724GVNVJRSF", "p": "0651316333"}, {"c": "CTM100863", "n": "260724H0FYTTHQ", "p": "0632646321"}, {"c": "CTM100853", "n": "585179929186895241", "p": "0989535632"}, {"c": "CTM100850", "n": "585179912394146848", "p": "0939165652"}, {"c": "CTM100848", "n": "585179929186895241", "p": "0989535632"}, {"c": "CTM100847", "n": "585180342734980721", "p": "0661430427"}, {"c": "CTM100846", "n": "585180492241995085", "p": "0992140031"}, {"c": "CTM100845", "n": "585180566010365549", "p": "0929708832"}, {"c": "CTM100844", "n": "585180579551610477", "p": "0929708832"}, {"c": "CTM100843", "n": "585178311877953450", "p": "0839648843"}, {"c": "CTM100842", "n": "585178396353005281", "p": "0619824165"}, {"c": "CTM100841", "n": "585178712000333260", "p": "0990368126"}, {"c": "CTM100840", "n": "585179457938883979", "p": "0888096558"}, {"c": "CTM100839", "n": "585179457938883979", "p": "0888096558"}, {"c": "CTM100838", "n": "585179803446445445", "p": "0626258461"}, {"c": "CTM100837", "n": "585179929186895241", "p": "0989535632"}, {"c": "CTM100836", "n": "585180235977951228", "p": "0618263551"}, {"c": "CTM100835", "n": "585178863752742455", "p": "0909802698"}, {"c": "CTM100833", "n": "ต่าย", "p": "0971134626"}, {"c": "CTM100832", "n": "585178959967979234", "p": "0962247499"}, {"c": "CTM100831", "n": "585179208568964278", "p": "0634900441"}, {"c": "CTM100830", "n": "585179756229789642", "p": "0956644963"}, {"c": "CTM100829", "n": "585179894682650616", "p": "0971709505"}, {"c": "CTM100828", "n": "585179912358036497", "p": "0985850650"}, {"c": "CTM100827", "n": "585179912433927619", "p": "0801647189"}, {"c": "CTM100826", "n": "585179912946091594", "p": "0929618829"}, {"c": "CTM100825", "n": "585179913577333963", "p": "0841815983"}, {"c": "CTM100824", "n": "585179928618763964", "p": "0626021661"}, {"c": "CTM100823", "n": "585179979419780897", "p": "0652703569"}, {"c": "CTM100822", "n": "กฤชมน ทนุรัตน์", "p": "0822747574"}, {"c": "CTM100821", "n": "มนัสนนท์ อุดกันทา", "p": "0935976280"}, {"c": "CTM100820", "n": "สุพิชญา รุจิพัฒนพงศ์", "p": "0816523878"}, {"c": "CTM100818", "n": "ลลิตา จิรวงศ์", "p": "0867856448"}, {"c": "CTM100817", "n": "ปัทมา ชิตตะขบ", "p": "0819556243"}, {"c": "CTM100816", "n": "ประพัฒน์ ฤทธิ์มาก", "p": "0988238437"}, {"c": "CTM100815", "n": "กานดา วงษ์ทำมา", "p": "0928695595"}, {"c": "CTM100814", "n": "หญิง", "p": "0659425535"}, {"c": "CTM100813", "n": "รัชดาภรณ์ ฤทธิญาณ", "p": "0839648843"}, {"c": "CTM100812", "n": "ณัฐกมล กิจงาม", "p": "0816223289"}, {"c": "CTM100811", "n": "นายิกา", "p": "0638655698"}, {"c": "CTM100810", "n": "แอม", "p": "0915662132"}, {"c": "CTM100809", "n": "260724GNKDN3WJ", "p": "0846565652"}, {"c": "CTM100808", "n": "260724GM4Q71BP", "p": "0646656632"}, {"c": "CTM100807", "n": "เทียนวรรณ สิทธิถาวร", "p": "0806659966"}, {"c": "CTM100803", "n": "เจ้แตน", "p": "0953377526"}, {"c": "CTM100802", "n": "ชนกานต์ สวยสม", "p": "0944831448"}, {"c": "CTM100801", "n": "คุณเนาวลักษณ์ หนักแน่น", "p": "0835077557"}, {"c": "CTM100797", "n": "260724GGQF314G", "p": "0874545521"}, {"c": "CTM100785", "n": "260724GF07XCGG", "p": "0854514445"}, {"c": "CTM100780", "n": "260724GDP84YPE", "p": "0621626635"}, {"c": "CTM100779", "n": "260724GG6EGSY0", "p": "0984656665"}, {"c": "CTM100776", "n": "260724GF0WUT54", "p": "0846465151"}, {"c": "CTM100774", "n": "260724GEFJTTNW", "p": "0840540545"}, {"c": "CTM100755", "n": "ประกายเกียรติ จันทร์สม", "p": "0851088277"}, {"c": "CTM100754", "n": "สุภาวิมล พันลำ", "p": "0834890261"}, {"c": "CTM100751", "n": "นัทธมน​ สีมาวุธ", "p": "0805924664"}, {"c": "CTM100750", "n": "แม่ ฉลอง", "p": "0834537438"}, {"c": "CTM100749", "n": "ไหวเร๊าะ มัดนุ้ย", "p": "0826570003"}, {"c": "CTM100748", "n": "รุ่งนภา พักตร์จันทร์", "p": "0824524192"}, {"c": "CTM100747", "n": "aung", "p": "0991947108"}, {"c": "CTM100746", "n": "อับดุลลูกมัน ยูโซ๊ะ", "p": "0982228588"}, {"c": "CTM100745", "n": "สหวน แก้วน้ำ", "p": "0986491829"}, {"c": "CTM100744", "n": "รชนก ทองฤธิท์", "p": "0621167237"}, {"c": "CTM100743", "n": "สุจิน วงศ์คำ", "p": "0848086001"}, {"c": "CTM100742", "n": "ปรายฟ้า", "p": "0993734493"}, {"c": "CTM100740", "n": "เดี่ยว3BB", "p": "0995277064"}, {"c": "CTM100739", "n": "ศรินรัตน์ พัชรเด่นวิทย์", "p": "0629361924"}, {"c": "CTM100737", "n": "ทิพวรรณ ถาวร", "p": "0847499048"}, {"c": "CTM100735", "n": "ชญาภา หลิกไชย", "p": "0983299596"}, {"c": "CTM100733", "n": "วรรณณุลักษณ์ คงขาว", "p": "0993805080"}, {"c": "CTM100732", "n": "สุทธิลักษณ์ พูพวก", "p": "0801619660"}, {"c": "CTM100730", "n": "อัครวินท์ ภูทวี", "p": "0866741928"}, {"c": "CTM100727", "n": "eim jung", "p": "0980983868"}, {"c": "CTM100726", "n": "นางพัตรา มาดี", "p": "0934788712"}, {"c": "CTM100724", "n": "Chu71", "p": "0808188871"}, {"c": "CTM100722", "n": "พงพันธ์ วิทยานุกรณ์-สุวรรณ", "p": "0656638896"}, {"c": "CTM100720", "n": "จันนะทร", "p": "0959517332"}, {"c": "CTM100718", "n": "วิทยา สาบวช", "p": "0625948914"}, {"c": "CTM100716", "n": "สมศักดิ์ ปาหลา", "p": "0961687199"}, {"c": "CTM100714", "n": "สุนันทาแก้วอามาตย์", "p": "0957709902"}, {"c": "CTM100712", "n": "ณัฐชัยใจหลัก", "p": "0800168755"}, {"c": "CTM100709", "n": "สิริ เดชะ", "p": "0810357664"}, {"c": "CTM100707", "n": "Pattaraphan Salirathavibhaga", "p": "0860517000"}, {"c": "CTM100705", "n": "ธนพล สินจะโปะ", "p": "0817156294"}, {"c": "CTM100704", "n": "พัชร์ศศิ ทองคำ", "p": "0902423295"}, {"c": "CTM100703", "n": "พิม", "p": "0831290399"}, {"c": "CTM100701", "n": "กองศรี ฆารฤทธิ์", "p": "0926039863"}, {"c": "CTM100699", "n": "ออย", "p": "0837869938"}, {"c": "CTM100696", "n": "กนกลักษณ์ สีมาลา", "p": "0631703439"}, {"c": "CTM100692", "n": "เจน", "p": "0954844330"}, {"c": "CTM100676", "n": "260723F1TVNC40", "p": "0653232232"}, {"c": "CTM100671", "n": "260724F9NH0VNF", "p": "0212122222"}, {"c": "CTM100660", "n": "260723EWHCAHQ7", "p": "0805411112"}, {"c": "CTM100658", "n": "260723EW35GDHH", "p": "0841631212"}, {"c": "CTM100657", "n": "260724FHBME9Y8", "p": "0956223233"}, {"c": "CTM100655", "n": "260724G2U9HBCG", "p": "0855112121"}, {"c": "CTM100654", "n": "260723F1DQ4QE9", "p": "0854144452"}, {"c": "CTM100652", "n": "260723EWVSM2GA", "p": "0854512852"}, {"c": "CTM100650", "n": "260724G31RFA6A", "p": "0854654154"}, {"c": "CTM100647", "n": "260723EXWMHE3Y", "p": "0984161665"}, {"c": "CTM100646", "n": "260723EUBE2HAN", "p": "0845121551"}, {"c": "CTM100642", "n": "260724FJHQ894J", "p": "0285631352"}, {"c": "CTM100639", "n": "260723ET74FJRN", "p": "0946361651"}, {"c": "CTM100635", "n": "260724G2X44WJ4", "p": "0854141132"}, {"c": "CTM100633", "n": "260723ESX4HQPC", "p": "0854112222"}, {"c": "CTM100632", "n": "260724FYP000DV", "p": "0854121852"}, {"c": "CTM100589", "n": "260723EKV332DW", "p": "0254151255"}, {"c": "CTM100587", "n": "260723EQXBKCF3", "p": "0854155482"}, {"c": "CTM100580", "n": "260723EUXWSW4J", "p": "0984651544"}, {"c": "CTM100578", "n": "260723EVC664NX", "p": "0661122326"}, {"c": "CTM100571", "n": "260723ERQHH327", "p": "0654113153"}, {"c": "CTM100568", "n": "260723EKHNB8EK", "p": "0654512152"}, {"c": "CTM100559", "n": "260723E9KPKF0H", "p": "0878445545"}, {"c": "CTM100556", "n": "260723E63GY7K3", "p": "0864455445"}, {"c": "CTM100552", "n": "260723E4W3MQNX", "p": "0854651545"}, {"c": "CTM100550", "n": "260723E43HDGCB", "p": "0965254236"}, {"c": "CTM100549", "n": "260723E2KNV23G", "p": "0245412148"}, {"c": "CTM100547", "n": "260723EFESQP33", "p": "0646543454"}, {"c": "CTM100546", "n": "260723ENG66DDR", "p": "0844341235"}, {"c": "CTM100544", "n": "260723EF4C01WT", "p": "0854434348"}, {"c": "CTM100543", "n": "260723EFAKAN6W", "p": "0985454563"}, {"c": "CTM100542", "n": "260723EA75C0QX", "p": "0894546452"}, {"c": "CTM100541", "n": "260723E5EME59M", "p": "0854645247"}, {"c": "CTM100540", "n": "260723E40MVSAH", "p": "0865435424"}, {"c": "CTM100539", "n": "260723EF0D4HBB", "p": "0863642147"}, {"c": "CTM100537", "n": "260723EE9PFS3V", "p": "0852426752"}, {"c": "CTM100536", "n": "260723EJPWW37A", "p": "0655335542"}, {"c": "CTM100534", "n": "260723EA3NSXUD", "p": "0214524587"}, {"c": "CTM100532", "n": "260723E2PUW3XJ", "p": "0896445241"}, {"c": "CTM100531", "n": "260723EB999ETT", "p": "0864621463"}, {"c": "CTM100524", "n": "260723EK61DJQ9", "p": "0685464564"}, {"c": "CTM100522", "n": "260723E3BU8DAR", "p": "0654046044"}, {"c": "CTM100509", "n": "กุลริศา คงทน", "p": "0648829914"}, {"c": "CTM100502", "n": "ศศิวิมล กางเพ็ง", "p": "0966679598"}, {"c": "CTM100500", "n": "ศศิวิมล กางเพ็ง", "p": "0966679598"}, {"c": "CTM100498", "n": "อังคนา ร้านเภสัช27", "p": "0633619549"}, {"c": "CTM100497", "n": "585163731803473723", "p": "0909202828"}, {"c": "CTM100496", "n": "585163265182238356", "p": "0909202828"}, {"c": "CTM100494", "n": "585163164836398771", "p": "0909202828"}, {"c": "CTM100491", "n": "JTTH201553984844", "p": "0909202828"}, {"c": "CTM100489", "n": "คุณพิมชนก ธีรวัฒน์", "p": "0959953287"}, {"c": "CTM100488", "n": "สมศักดิ์ ท้าวนิรันดร์กูล", "p": "0808604039"}, {"c": "CTM100487", "n": "หนูกูล สมวงค์", "p": "0982483182"}, {"c": "CTM100486", "n": "อภิชาติ คงวิริยะกุล", "p": "0651212744"}, {"c": "CTM100484", "n": "โช สุรามาศ", "p": "0856677812"}, {"c": "CTM100483", "n": "คุณนิคม สนเอี่ยม", "p": "0955542493"}, {"c": "CTM100481", "n": "จุฑารัตน์ คงมาก", "p": "0950130585"}, {"c": "CTM100480", "n": "อ่อง สิงคำ", "p": "0888293017"}, {"c": "CTM100479", "n": "วลัยพร วรพงศ์กิติพันธ์", "p": "0863696353"}, {"c": "CTM100478", "n": "ดวงพร หุ่นพยนต์", "p": "0845688397"}, {"c": "CTM100477", "n": "สุดารัตย์ คงเซ็น", "p": "0652271477"}, {"c": "CTM100476", "n": "สมสรรค์ เฝ้าทรัพย์(ครูปุ๋ย)", "p": "0844053569"}, {"c": "CTM100475", "n": "จุลนพ ทองโสภิต", "p": "0816611771"}, {"c": "CTM100474", "n": "เวณิกา ลิ้มเจริญ", "p": "0924699799"}, {"c": "CTM100473", "n": "จันทร์จีรา คำน้อย", "p": "0876022349"}, {"c": "CTM100472", "n": "260723DS31CF5Y", "p": "0965465623"}, {"c": "CTM100470", "n": "ปุณณัฐฐา บุญปัน", "p": "0951561442"}, {"c": "CTM100469", "n": "260723E6597DV1", "p": "0654626663"}, {"c": "CTM100462", "n": "ชัชฎาภรณ์ จุลรังษี", "p": "0872894309"}, {"c": "CTM100461", "n": "ศิรภัสสร เลิศมงคล", "p": "0646366289"}, {"c": "CTM100456", "n": "260722CCQQHTY2", "p": "0265634421"}, {"c": "CTM100455", "n": "ภูวนัย อุ่นเจริญ", "p": "0826585619"}, {"c": "CTM100454", "n": "นพพร มีเพียร", "p": "0871045452"}, {"c": "CTM100453", "n": "นาตยา สุดเสนาะ", "p": "0954635553"}, {"c": "CTM100435", "n": "260723DYNTRBDH", "p": "0654165652"}, {"c": "CTM100432", "n": "260723DWPKYEB0", "p": "0652632565"}, {"c": "CTM100431", "n": "260723DWFKU3DB", "p": "0895465966"}, {"c": "CTM100426", "n": "260723DWTQKFJS", "p": "0654632656"}, {"c": "CTM100423", "n": "260723DVNYNFFW", "p": "0855456664"}, {"c": "CTM100421", "n": "260723DWQ54MAW", "p": "0654654184"}, {"c": "CTM100389", "n": "260723DXNGXPKJ", "p": "0661636533"}, {"c": "CTM100385", "n": "260722BJ36SGFK", "p": "0635522563"}, {"c": "CTM100374", "n": "จตุรงค์ ผาวงษา", "p": "0942532564"}, {"c": "CTM100370", "n": "น.ส.จันทิรา นวลจันทร์", "p": "0632552265"}, {"c": "CTM100365", "n": "นุชรี เลิศปรีชาเมธากุล", "p": "0957433088"}, {"c": "CTM100362", "n": "ศศพินทุ์ ศิริวาณิชย์", "p": "0815939644"}, {"c": "CTM100358", "n": "รุ้งทิวา พุฒิธีระโชคิ", "p": "0925941965"}, {"c": "CTM100356", "n": "สรัลรัชช์ ธัญญสิริโรจน์", "p": "0959495436"}, {"c": "CTM100345", "n": "260723DHQHCTMN", "p": "0963552354"}, {"c": "CTM100342", "n": "260723DSR6GXAK", "p": "0256524142"}, {"c": "CTM100340", "n": "260723DQAWMFBA", "p": "0652133212"}, {"c": "CTM100337", "n": "260723DMMPMW68", "p": "0626323232"}, {"c": "CTM100334", "n": "260723DSPE7AKC", "p": "0655232353"}, {"c": "CTM100329", "n": "260723DT3RHH9K", "p": "0655255455"}, {"c": "CTM100328", "n": "260723DPSDS98J", "p": "0966352411"}, {"c": "CTM100324", "n": "260723DURV01BH", "p": "0626635262"}, {"c": "CTM100323", "n": "260723DPPR0B3U", "p": "0653252231"}, {"c": "CTM100322", "n": "260723DJTH0MQX", "p": "0934135200"}, {"c": "CTM100318", "n": "260723DP11QP4T", "p": "0246546465"}, {"c": "CTM100303", "n": "260722C5YCVS6Y", "p": "0232511222"}, {"c": "CTM100293", "n": "260723DQ2S7BEY", "p": "0236552215"}, {"c": "CTM100286", "n": "260722CDY92HRE", "p": "0652655565"}, {"c": "CTM100260", "n": "260723DQGSG26V", "p": "0226566354"}, {"c": "CTM100254", "n": "260722C8X5JBJP", "p": "0632151662"}, {"c": "CTM100248", "n": "260722BVD9NA0E", "p": "0984644664"}, {"c": "CTM100247", "n": "260722BUKFSU16", "p": "0653351562"}, {"c": "CTM100242", "n": "260722CMJX3UWA", "p": "0635214513"}, {"c": "CTM100238", "n": "260722CHG0T6BR", "p": "0952364256"}, {"c": "CTM100207", "n": "260722CDHT2Q5V", "p": "0635245628"}, {"c": "CTM100206", "n": "260722C6CTX69F", "p": "0651218532"}, {"c": "CTM100203", "n": "260723DC3YGYSH", "p": "0652355741"}, {"c": "CTM100202", "n": "260722CE2F3X7E", "p": "0935211456"}, {"c": "CTM100200", "n": "260722CJ0UPHEW", "p": "0652412639"}, {"c": "CTM100197", "n": "260723DB0MEC7M", "p": "0632545112"}, {"c": "CTM100195", "n": "260722CHAR30BM", "p": "0621654442"}, {"c": "CTM100193", "n": "260723DE67JNCE", "p": "0963552361"}, {"c": "CTM100192", "n": "260722CDA07MGB", "p": "0936521563"}, {"c": "CTM100191", "n": "260722C9WPJS2K", "p": "0963628541"}, {"c": "CTM100190", "n": "260723CRJW6BQC", "p": "0963622236"}, {"c": "CTM100189", "n": "260723CV1DBTK1", "p": "0900000003"}, {"c": "CTM100188", "n": "260723CVW4AYTJ", "p": "0936524125"}, {"c": "CTM100187", "n": "260722CKN5CSJH", "p": "0900000006"}, {"c": "CTM100186", "n": "260722CHAYN5W8", "p": "0900000069"}, {"c": "CTM100185", "n": "260723CYG91RS1", "p": "0936252365"}, {"c": "CTM100184", "n": "260723D98NFVQF", "p": "0900000002"}, {"c": "CTM100183", "n": "260722CA7029N0", "p": "0900000003"}, {"c": "CTM100182", "n": "260723CV7MRR9W", "p": "0900000000"}, {"c": "CTM100181", "n": "260723CTGYQK5W", "p": "0632523685"}, {"c": "CTM100180", "n": "260722CCTTT13U", "p": "0932652120"}, {"c": "CTM100179", "n": "260722C59NKWEE", "p": "0935200000"}, {"c": "CTM100178", "n": "แงซาย", "p": "0619788095"}, {"c": "CTM100177", "n": "ธิดารัตน์ ตูมสันเทียะ", "p": "0625355463"}, {"c": "CTM100176", "n": "ไสภา สทธิดำรงค์", "p": "0965222263"}, {"c": "CTM100175", "n": "260722C62WDHFP", "p": "0863521453"}, {"c": "CTM100174", "n": "260722C7V7AQ6K", "p": "0865513654"}, {"c": "CTM100173", "n": "260722C5HFF63A", "p": "0800035214"}, {"c": "CTM100172", "n": "260722C0EHSV2B", "p": "0900000002"}, {"c": "CTM100171", "n": "260722B7R1HY2W", "p": "0832569421"}, {"c": "CTM100169", "n": "คุณพิมพ์ลภัส บุญปลูก", "p": "0952893241"}, {"c": "CTM100160", "n": "260722BPSBDVM8", "p": "0800000033"}, {"c": "CTM100135", "n": "Nattakorn Taweesak", "p": "0935952456"}, {"c": "CTM100133", "n": "เพชรราช", "p": "0636392365"}, {"c": "CTM100131", "n": "สทิธิพล เมฆวงศ", "p": "0959533656"}, {"c": "CTM100128", "n": "ปราจีน เกาวิจิร", "p": "0831503712"}, {"c": "CTM100127", "n": "เพชรราช", "p": "0636392365"}, {"c": "CTM100126", "n": "นิราช", "p": "0804781240"}, {"c": "CTM100125", "n": "แน่งน้อย อาจทรง", "p": "0892495942"}, {"c": "CTM100120", "n": "อมรรัตน์ จันทรศรี", "p": "0960292885"}, {"c": "CTM100116", "n": "ธีรยุทธ จำเริญ", "p": "0955491024"}, {"c": "CTM100115", "n": "นารา เลี้ยวซ้ายซอยแรก", "p": "0812355193"}, {"c": "CTM100114", "n": "พวงทอง วิรัชศิลป์", "p": "0899994976"}, {"c": "CTM100112", "n": "กัญญาวีร์", "p": "0694488297"}, {"c": "CTM100107", "n": "น๋อต เรสซิ่ง", "p": "0958026407"}, {"c": "CTM100106", "n": "อรวรรณ คล้ายรักษา", "p": "0613612839"}, {"c": "CTM100105", "n": "กฤษณา วุฒิเดช", "p": "0801533553"}, {"c": "CTM100102", "n": "ลักษณา ม่วงศรี", "p": "0844662244"}, {"c": "CTM100100", "n": "ธนา ธราภาค", "p": "0859124233"}, {"c": "CTM100098", "n": "ธรณัส กนกบรรพต", "p": "0818648905"}, {"c": "CTM100097", "n": "สุนิสา กาฬภักดี", "p": "0894150787"}, {"c": "CTM100095", "n": "จิตรมณี ไทยสงฆ์", "p": "0917375867"}, {"c": "CTM100091", "n": "จารวุรรณ ไกรวาส", "p": "0948036063"}, {"c": "CTM100090", "n": "leklek", "p": "0819293559"}, {"c": "CTM100089", "n": "พรศิริ นฤหายะ", "p": "0842260990"}, {"c": "CTM100088", "n": "ธัญญรัตน์ เดชะคำภู", "p": "0885836565"}, {"c": "CTM100087", "n": "พิมพ์ปวีณ์ บุญมาจันทร์", "p": "0950799982"}, {"c": "CTM100086", "n": "ธัญญพัทธ์ มุกดา", "p": "0944645405"}, {"c": "CTM100085", "n": "ปราโมทย์", "p": "0972798756"}, {"c": "CTM100084", "n": "พิมพ์มาดา ธาราภูมิ", "p": "0823474263"}, {"c": "CTM100083", "n": "มุจรินทร์ พวงทรัพย์(กรุณาส่งหน้าโรงงาน)", "p": "0817842266"}, {"c": "CTM100082", "n": "ร้านเสริมสวย", "p": "0825659118"}, {"c": "CTM100081", "n": "สมพร ไตรษร", "p": "0969524598"}, {"c": "CTM100079", "n": "ป้ากุ้ง ป้ากุ้ง", "p": "0924533662"}, {"c": "CTM100078", "n": "ราตรี นันทนาภรณ์โสภณ", "p": "0866106754"}, {"c": "CTM100077", "n": "ดวงฤทัย จุ่มน้อย", "p": "0948719656"}, {"c": "CTM100076", "n": "โอ๋", "p": "0839293299"}, {"c": "CTM100075", "n": "วัชรี", "p": "0812943231"}, {"c": "CTM100074", "n": "มัลลิกา ภู่อุปถัมภ์เมธา", "p": "0827458601"}, {"c": "CTM100073", "n": "วรรณี", "p": "0820954422"}, {"c": "CTM100072", "n": "ธัญญาภัทร์ บำรุงดี", "p": "0828828049"}, {"c": "CTM100071", "n": "ธิวาภรณ์ สังขพงศ์", "p": "0819223993"}, {"c": "CTM100069", "n": "ณัฐวุฒิ บุญมาทัน", "p": "0649868407"}, {"c": "CTM100068", "n": "ต่าย", "p": "0946141565"}, {"c": "CTM100067", "n": "ปัน", "p": "0947691312"}, {"c": "CTM100022", "n": "ปราณี ธาดา", "p": "0820780537"}, {"c": "CTM100018", "n": "น.ส.จารุวรรณ ไกรวาส", "p": "0948036063"}, {"c": "CTM100017", "n": "leklek", "p": "0819293559"}, {"c": "CTM100016", "n": "260722BCANMV84", "p": "0902000000"}, {"c": "CTM100014", "n": "260722BC6VH6BK", "p": "0999999999"}, {"c": "CTM100012", "n": "คุณธนา อุไรสินธว์", "p": "0889459965"}, {"c": "CTM100011", "n": "กริช", "p": "0816267336"}, {"c": "CTM100010", "n": "ชื่นฤทัย ยี่เขียน", "p": "0818624534"}, {"c": "CTM100009", "n": "ประภา รวมพรรณพงศ์", "p": "0819687334"}, {"c": "CTM100008", "n": "กานติมา สุขคล้าย", "p": "0917522822"}, {"c": "CTM100007", "n": "นก", "p": "0813025882"}, {"c": "CTM100006", "n": "ธนารักษ์ ทิพย์กนก", "p": "0831533063"}, {"c": "CTM100005", "n": "จิรวดี สุขวาณิชวิชัย", "p": "0972981495"}, {"c": "CTM100004", "n": "คุณกฤษณะ งามผิว", "p": "0818643620"}, {"c": "CTM100003", "n": "สมบูรณ์ พิทยาวิวัฒน์", "p": "0923399715"}, {"c": "CTM100002", "n": "จรินทิพย์ แสงหอม", "p": "0866558782"}, {"c": "CTM100001", "n": "นายสิริศักดิ์ สุรอารีย์กุล", "p": "0933267955"}, {"c": "CTM100000", "n": "ทดสอบ ทดสอบ", "p": "0812345678"}];   // ฐานตั้งต้น 376 ราย (รอบ 1) เพื่อให้ W/K ตรงกับไฟล์ที่เคยได้

  var state={assigned:[],maxRound:1};
  var seen=new Set();
  var lastNewW=0,lastNewK=0,lastDup=0,lastCut=0,lastRound=1;

  function clean(s){return String(s==null?'':s).replace(/\D/g,'');}
  function valid(p){return /^0[2689]\d{8}$/.test(clean(p));}
  function keyOf(r){return (r.code&&(''+r.code).trim())?('C:'+(''+r.code).trim()):('NP:'+(''+(r.name||'')).trim()+'|'+clean(r.phone));}
  function roundName(n){return n===1?'ตั้งต้น':('รอบ '+n);}
  function todayTH(){var d=new Date(),p=function(n){return String(n).padStart(2,'0');};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+(d.getFullYear()+543);}
  function nextSide(){var w=0,k=0;state.assigned.forEach(function(a){a.sales==='W'?w++:k++;});return w<=k?'W':'K';}
  function rebuildSeen(){seen=new Set();state.assigned.forEach(function(a){seen.add(keyOf(a));});}

  function load(){
    try{var s=localStorage.getItem(LS);if(s){state=JSON.parse(s);}}catch(e){}
    if(!state||!Array.isArray(state.assigned)||!state.assigned.length){
      // seed
      state={assigned:[],maxRound:1};
      SEED.forEach(function(r){
        if(!valid(r.p))return;
        var rec={code:r.c,name:r.n,phone:clean(r.p),sales:null,round:1,date:BASE_DATE};
        rec.sales=nextSide(); state.assigned.push(rec);
      });
    }
    rebuildSeen();
    if(!state.maxRound)state.maxRound=1;
  }
  function save(){try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}}

  function applyNew(records,label){
    var vnew=[]; lastDup=0; lastCut=0;
    records.forEach(function(r){
      var rec={code:(r.code||'').trim(),name:(r.name||'').trim(),phone:clean(r.phone)};
      if(!(rec.code||rec.name||rec.phone))return;
      if(!valid(rec.phone)){lastCut++;return;}
      var k=keyOf(rec);
      if(seen.has(k)){lastDup++;return;}
      seen.add(k); vnew.push(rec);
    });
    lastNewW=0;lastNewK=0;lastRound=state.maxRound;
    if(vnew.length){
      lastRound=state.maxRound+1; state.maxRound=lastRound;
      var dt=(label&&label.trim())?label.trim():todayTH();
      vnew.forEach(function(rec){
        var s=nextSide(); rec.sales=s; rec.round=lastRound; rec.date=dt;
        state.assigned.push(rec); s==='W'?lastNewW++:lastNewK++;
      });
    }
    save();
    return vnew.length;
  }

  function listW(){return state.assigned.filter(function(a){return a.sales==='W';});}
  function listK(){return state.assigned.filter(function(a){return a.sales==='K';});}

  function getAuth(){try{return JSON.parse(localStorage.getItem('auth'));}catch(e){return null;}}
  function facility(){var a=getAuth();if(a){if(typeof a.facilityIdActive==='string')return a.facilityIdActive;if(Array.isArray(a.facilityId)&&a.facilityId.length)return a.facilityId[0];}return 'WebStoreWarehouse';}

  function fetchAll(){
    var a=getAuth(); if(!a||!a.accessToken){return Promise.reject('ไม่พบ token — กรุณาล็อกอิน Evolution');}
    var body={filter:{FACILITY_ID:facility()},paginator:{page:1,pageSize:100000,total:0,pageSizes:[]},sorting:{column:'PARTY_ID',direction:'desc'},searchTerm:'',grouping:{selectedRowIds:{},itemIds:[],selectAll:false}};
    return fetch(API,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','x-access-token':a.accessToken},body:JSON.stringify(body)})
      .then(function(r){if(r.status===401||r.status===403)throw 'token หมดอายุ — กรุณารีเฟรชหน้าและล็อกอินใหม่';return r.json();})
      .then(function(j){return (j.items||[]).map(function(it){var p=it.person||{};var nm=[p.FIRST_NAME,p.MIDDLE_NAME,p.LAST_NAME].filter(function(x){return x&&(''+x).trim();}).join(' ').trim();var ph=(it.telecomNumber&&it.telecomNumber.CONTACT_NUMBER)||'';return {code:it.PARTY_ID,name:nm,phone:ph};});});
  }

  // ---------- download ----------
  function dl(content,fname,type){var b=new Blob([content],{type:type});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=fname;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},2000);}
  function csvEsc(s){s=String(s==null?'':s);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function toCsv(list){var head='ลำดับ,รหัสสมาชิก,ชื่อ-นามสกุล,เบอร์โทรศัพท์,รอบที่ดึง,วันที่แบ่ง';return '﻿'+head+'\n'+list.map(function(r,i){return [i+1,csvEsc(r.code),csvEsc(r.name),csvEsc(r.phone),csvEsc(roundName(r.round)),csvEsc(r.date)].join(',');}).join('\n');}
  function exportCsv(which){var list=which==='W'?listW():listK();dl(toCsv(list),'Sales_'+which+'_'+list.length+'.csv','text/csv;charset=utf-8');}
  function ensureXLSX(){return new Promise(function(res,rej){if(window.XLSX)return res();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=function(){res();};s.onerror=function(){rej('โหลดตัวสร้าง Excel ไม่สำเร็จ');};document.head.appendChild(s);});}
  function exportXlsx(){
    ensureXLSX().then(function(){
      var W=listW(),K=listK();
      var mk=function(list){return [['ลำดับ','รหัสสมาชิก','ชื่อ-นามสกุล','เบอร์โทรศัพท์','รอบที่ดึง','วันที่แบ่ง']].concat(list.map(function(r,i){return [i+1,r.code,r.name,r.phone,roundName(r.round),r.date];}));};
      var all=[['ลำดับ','รหัสสมาชิก','ชื่อ-นามสกุล','เบอร์โทรศัพท์','เซลล์','รอบที่ดึง','วันที่แบ่ง']].concat(state.assigned.map(function(r,i){return [i+1,r.code,r.name,r.phone,r.sales,roundName(r.round),r.date];}));
      var wb=XLSX.utils.book_new();
      var wsW=XLSX.utils.aoa_to_sheet(mk(W)),wsK=XLSX.utils.aoa_to_sheet(mk(K)),wsA=XLSX.utils.aoa_to_sheet(all);
      wsW['!cols']=wsK['!cols']=[{wch:7},{wch:15},{wch:32},{wch:16},{wch:12},{wch:14}];
      wsA['!cols']=[{wch:7},{wch:15},{wch:32},{wch:16},{wch:8},{wch:12},{wch:14}];
      W.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsW[c])wsW[c].t='s';});
      K.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsK[c])wsK[c].t='s';});
      state.assigned.forEach(function(r,i){var c=XLSX.utils.encode_cell({r:i+1,c:3});if(wsA[c])wsA[c].t='s';});
      XLSX.utils.book_append_sheet(wb,wsW,'Sales(W)');
      XLSX.utils.book_append_sheet(wb,wsK,'Sales(K)');
      XLSX.utils.book_append_sheet(wb,wsA,'ทั้งหมด');
      XLSX.writeFile(wb,'รายชื่อลูกค้า_แบ่ง_W_K.xlsx');
    }).catch(function(e){setStatus('❌ '+e);});
  }

  // ---------- UI ----------
  var panel,statusEl,statEl,listBox;
  function css(){var s=document.createElement('style');s.textContent=
   '#evoWK{position:fixed;right:18px;bottom:18px;z-index:999999;width:340px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);font-family:Sarabun,Tahoma,sans-serif;color:#1f2937;font-size:13px;overflow:hidden}'
  +'#evoWK .hd{background:#1f4e79;color:#fff;padding:10px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}'
  +'#evoWK .hd .x{cursor:pointer;opacity:.85;font-weight:400}'
  +'#evoWK .bd{padding:12px 14px}'
  +'#evoWK .st{font-size:12px;color:#6b7280;min-height:16px;margin-bottom:8px}'
  +'#evoWK .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px}'
  +'#evoWK .box{background:#f4f6f9;border-radius:9px;padding:8px;text-align:center}'
  +'#evoWK .box b{display:block;font-size:19px}'
  +'#evoWK .box.w b{color:#1f6f3b}#evoWK .box.k b{color:#b45309}#evoWK .box.t b{color:#1f4e79}'
  +'#evoWK .box span{font-size:11px;color:#6b7280}'
  +'#evoWK .btns{display:flex;flex-wrap:wrap;gap:7px}'
  +'#evoWK button{font-family:inherit;font-size:12.5px;font-weight:600;border:0;border-radius:8px;padding:8px 11px;cursor:pointer}'
  +'#evoWK .b1{background:#166534;color:#fff}#evoWK .b2{background:#1f6f3b;color:#fff}#evoWK .b3{background:#b45309;color:#fff}#evoWK .b4{background:#1f4e79;color:#fff}#evoWK .bg{background:#eef1f5;color:#1f2937}'
  +'#evoWK .lst{margin-top:10px;max-height:220px;overflow:auto;border-top:1px solid #eee;display:none}'
  +'#evoWK table{width:100%;border-collapse:collapse;font-size:11.5px}#evoWK th,#evoWK td{padding:4px 6px;border-bottom:1px solid #f0f2f5;text-align:left;white-space:nowrap}'
  +'#evoWK tr.nw td{background:#fffbe6}';
   document.head.appendChild(s);}
  function build(){
    css();
    panel=document.createElement('div');panel.id='evoWK';
    panel.innerHTML=''
     +'<div class="hd"><span>⚡ แบ่งลูกค้า W / K</span><span class="x" title="ซ่อน">✕</span></div>'
     +'<div class="bd">'
     +'<div class="st" id="evoWKst">กำลังเริ่ม…</div>'
     +'<div class="grid"><div class="box t"><b id="evoWKa">0</b><span>รวม</span></div><div class="box w"><b id="evoWKw">0</b><span>Sales(W)</span></div><div class="box k"><b id="evoWKk">0</b><span>Sales(K)</span></div></div>'
     +'<div class="btns">'
     +'<button class="b1" id="evoWKxlsx">⬇ Excel</button>'
     +'<button class="b2" id="evoWKcsvW">⬇ CSV W</button>'
     +'<button class="b3" id="evoWKcsvK">⬇ CSV K</button>'
     +'<button class="b4" id="evoWKsync">🔄 ดึงอีกครั้ง</button>'
     +'<button class="bg" id="evoWKview">▾ ดูรายชื่อ</button>'
     +'<button class="bg" id="evoWKreset">↺ รีเซ็ต</button>'
     +'</div>'
     +'<div class="lst" id="evoWKlist"></div>'
     +'</div>';
    document.body.appendChild(panel);
    statusEl=panel.querySelector('#evoWKst');
    listBox=panel.querySelector('#evoWKlist');
    panel.querySelector('.x').onclick=function(){panel.style.display='none';};
    panel.querySelector('#evoWKxlsx').onclick=exportXlsx;
    panel.querySelector('#evoWKcsvW').onclick=function(){exportCsv('W');};
    panel.querySelector('#evoWKcsvK').onclick=function(){exportCsv('K');};
    panel.querySelector('#evoWKsync').onclick=function(){sync(true);};
    panel.querySelector('#evoWKview').onclick=toggleList;
    panel.querySelector('#evoWKreset').onclick=function(){if(confirm('รีเซ็ตกลับเป็นข้อมูลตั้งต้น 376 ราย (รอบ 1)? การเติมรายใหม่ที่ผ่านมาจะถูกล้าง')){localStorage.removeItem(LS);state={assigned:[],maxRound:1};load();renderStats();setStatus('รีเซ็ตแล้ว');}};
  }
  function setStatus(t){if(statusEl)statusEl.textContent=t;}
  function renderStats(){
    panel.querySelector('#evoWKa').textContent=state.assigned.length;
    panel.querySelector('#evoWKw').textContent=listW().length;
    panel.querySelector('#evoWKk').textContent=listK().length;
  }
  function toggleList(){
    if(listBox.style.display==='block'){listBox.style.display='none';return;}
    var W=listW(),K=listK(),n=Math.max(W.length,K.length);
    var h='<table><thead><tr><th>#</th><th>W: รหัส</th><th>ชื่อ</th><th>K: รหัส</th><th>ชื่อ</th></tr></thead><tbody>';
    for(var i=0;i<n;i++){var w=W[i],k=K[i];h+='<tr class="'+((w&&w.round>1)||(k&&k.round>1)?'nw':'')+'"><td>'+(i+1)+'</td><td>'+(w?w.code:'')+'</td><td>'+(w?w.name:'')+'</td><td>'+(k?k.code:'')+'</td><td>'+(k?k.name:'')+'</td></tr>';}
    h+='</tbody></table>';listBox.innerHTML=h;listBox.style.display='block';
  }

  function pushToServer(records){
    return fetch(SYNC_URL.replace(/\/+$/,'')+'/api/ingest',{method:'POST',headers:{'Content-Type':'application/json','x-ingest-key':SYNC_KEY},body:JSON.stringify({customers:records})})
      .then(function(r){if(!r.ok)throw ('HTTP '+r.status);return r.json();});
  }

  function sync(manual){
    setStatus('⏳ กำลังดึงข้อมูลจากระบบ…');
    fetchAll().then(function(records){
      var n=applyNew(records);
      renderStats();
      if(listBox.style.display==='block')toggleList();
      var localMsg = n>0 ? ('เพิ่มใหม่ '+n+' (W '+lastNewW+'/K '+lastNewK+')') : 'ไม่มีรายใหม่';
      if(SYNC_URL){
        setStatus('☁ กำลังส่งขึ้นเว็บ…');
        var a0=getAuth();
        if(a0&&a0.accessToken){ fetch(SYNC_URL.replace(/\/+$/,'')+'/api/token',{method:'POST',headers:{'Content-Type':'application/json','x-ingest-key':SYNC_KEY},body:JSON.stringify({token:a0.accessToken,facility:facility()})}).catch(function(){}); }
        pushToServer(records).then(function(res){
          var s=res.summary||{};
          setStatus('☁ ส่งขึ้นเว็บแล้ว: เพิ่มใหม่ '+s.added+' (W '+s.addW+'/K '+s.addK+') · ข้ามซ้ำ '+s.dup+' · เบอร์ไม่ผ่าน '+s.cut+' · รวมบนเว็บ '+res.total);
        }).catch(function(e){ setStatus('⚠ แบ่งในเครื่องแล้ว ('+localMsg+') แต่ส่งขึ้นเว็บไม่สำเร็จ: '+e); });
      } else {
        if(n>0){setStatus('✅ '+roundName(lastRound)+' ('+ (state.assigned.find(function(a){return a.round===lastRound;})||{}).date +'): เพิ่มใหม่ '+n+' ราย (W '+lastNewW+'/K '+lastNewK+') · ข้ามซ้ำ '+lastDup+' · เบอร์ไม่ผ่าน '+lastCut);}
        else{setStatus('✔ ข้อมูลเป็นปัจจุบัน ไม่มีรายใหม่ (ข้ามซ้ำ '+lastDup+' · เบอร์ไม่ผ่าน '+lastCut+')');}
      }
    }).catch(function(e){setStatus('❌ '+e);});
  }

  // start
  load(); build(); renderStats(); setStatus('พร้อม · ฐาน '+state.assigned.length+' ราย — กำลังตรวจรายใหม่…');
  setTimeout(function(){sync(false);},1200);
  if(AUTO_REFRESH_MIN>0){setInterval(function(){sync(false);},AUTO_REFRESH_MIN*60000);}
})();
