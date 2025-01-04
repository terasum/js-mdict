import { MDX } from '../dist/cjs/index.js';

const mdx = new MDX('./tests/data/oald7.mdx');
console.log(mdx.header);
console.log(mdx.lookup('example'));

/*
$ git clone github.com/terasum/js-mdict
$ cd js-mdict
$ npx tsx ./example/oald7-example.ts

{
  GeneratedByEngineVersion: '1.2',
  RequiredEngineVersion: '1.2',
  Encrypted: 'No',
  Encoding: 'UTF-8',
  Format: 'Html',
  Compact: 'Yes',
  Compat: 'Yes',
  KeyCaseSensitive: 'No',
  Description: '<font size=5 color=red>Paste the description of this product in HTML source code format here</font>',
  Title: 'Oxford Advanced Learner&apos;s Dictionary 7th',
  DataSourceFormat: '106',
  StyleSheet: '',
  StripKey: 'Yes'
}
{
  keyText: 'example',
  definition: '<head><link rel="stylesheet" type="text/css" href="O7.css"/></head><body><span class="hw"> ex∙ample </span hw> <img src="key.gif"/><span class="i_g"> /<a class="i_phon" href="sound://eexample_ggn_r1_oa084570.spx">ɪgˈzɑ:mpl</a i_phon><span class="z">; </span z><i>NAmE</i> <a class="y_phon" href="sound://eexample_ggx_r1_wpu04721.spx">-ˈzæmpl</a y_phon>​/ </span i_g><span class="cls"> noun</span cls>\r\n' +
    '<div class="define"><span class="numb">1</span numb><span class="cf"> ~ <span class="bra">(</span bra>of sth<span class="bra">)</span bra> </span cf><span class="d">something such as an object, a fact or a situation that shows, explains or supports what you say<span class="chn"> 实例；例证；例子</span chn></span d></div define>\r\n' +
    '<span class="sentence_eng">Can you give me an example of what you mean? </span sentence_eng>\r\n' +
    '<span class="sentence_chi">你能给我举个实例来解释你的意思吗？</span sentence_chi>\r\n' +
    '<span class="sentence_eng">It is important to cite examples to support your argument. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">用实例来证明你的论点是重要的。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">This dictionary has many examples of how words are used. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">这部词典有许多关于词语用法的示例。</span sentence_chi>\r\n' +
    `<span class="sentence_eng">Just to give you an example of his generosity—he gave me his old car and wouldn't take any money for it. </span sentence_eng>\r\n` +
    '<span class="sentence_chi">且举个例子来说明他的慷慨吧 —— 他把他的旧汽车给了我，而且分文不取。</span sentence_chi>\r\n' +
    '<div class="define"><span class="numb">2</span numb><span class="cf"> ~ <span class="bra">(</span bra>of sth<span class="bra">)</span bra> </span cf><span class="d">a thing that is typical of or represents a particular group or set<span class="chn"> 典型；范例；样品</span chn></span d></div define>\r\n' +
    `<span class="sentence_eng">This is a good example of the artist's early work. </span sentence_eng>\r\n` +
    '<span class="sentence_chi">这是这位艺术家早期作品的范例。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">It is a <span class="cl"> perfect example </span cl>of a medieval castle.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">这是最典型的中世纪城堡。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">Japan is often quoted as the <span class="cl"> prime example </span cl>of a modern industrial nation.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">人们经常举例把日本作为现代工业国家的典范。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">It is a <span class="cl"> classic example </span cl>of how not to design a new city centre.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">这对于如何设计新市中心是个绝佳的反面教材。</span sentence_chi>\r\n' +
    '<div class="define"><span class="numb">3</span numb><span class="cf"> ~ <span class="bra">(</span bra>to sb<span class="bra">)</span bra> </span cf><span class="d">a person or their behaviour that is thought to be a good model for others to copy<span class="chn"> 榜样；楷模；模范</span chn></span d></div define>\r\n' +
    '<span class="sentence_eng">Her courage is an example to us all. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">她的勇气是我们大家的榜样。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">He <span class="cl"> sets an example </span cl>to the other students.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">他为其他同学树立了榜样。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">She is a <span class="cl"> shining example </span cl>of what people with disabilities can achieve.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">她为残疾人有所作为树立了光辉的榜样。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">He is a captain who leads <span class="cl"> by example</span cl>.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">他是个以身作则的队长。</span sentence_chi>\r\n' +
    `<div class="define"><span class="numb">4</span numb><span class="d">a person's behaviour, either good or bad, that other people copy<span class="chn"> 样板；榜样</span chn></span d></div define>\r\n` +
    '<span class="sentence_eng">It would be a mistake to <span class="cl"> follow his example</span cl>.</span sentence_eng>\r\n' +
    '<span class="sentence_chi">仿效他的做法是错误的。</span sentence_chi>\r\n' +
    '<div class="idm_g"><span class="sym_idm">IDM</span sym_idm> <span class="idm"> for example </span idm><span class="bra">(</span bra><i>abbr.</i> <span class="ab">e.g.</span ab><span class="bra">)</span bra> <span class="ud"> used to emphasize sth that explains or supports what you are saying; used to give an example of what you are saying<span class="chn"> 例如；譬如</span chn> </span ud><br>\r\n' +
    '<span class="sentence_eng">There is a similar word in many languages, for example in French and Italian. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">在许多语言，譬如法语和意大利语中都有相似的词。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">The report is incomplete; it does not include sales in France, for example. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">这份报告不完整，例如在法国的销售情况就没包括进去。</span sentence_chi>\r\n' +
    '<span class="sentence_eng">It is possible to combine Computer Science with other subjects, for example Physics. </span sentence_eng>\r\n' +
    '<span class="sentence_chi">将计算机科学与其他学科，如物理学，结合起来是可能的。</span sentence_chi>\r\n' +
    '</div idm_g><div class="idm_g"><span class="idm"> make an example of sb </span idm><span class="d">to punish sb as a warning to others not to do the same thing<span class="chn"> 惩罚某人以儆戒他人；用某人来杀一儆百</span chn></span d><span class="oa_ill"></span ill ref="SYNALD7_EXAMPLE" cols="ONE" descrip=""></div idm_g>\r\n' +
    '<h1></h1><table><tr><th class="unbox_header">SYNONYMS 同义词辨析</th></tr><tr><td colspan="2"><div class="unbox" parentclass="e" type="synald7" name="example" eid="example_un_1" id="example_un_1" class="un" unidoupc="synald7_example"><span class="title">example</span title><div class="subhead">case | instance | specimen | illustration</div subhead>\r\n' +
    '<div class="para" outdent="n">\r\n' +
    '<span class="undes"><span class="und">These are all words for a thing or situation that is typical of a particular group or set, and is sometimes used to support an argument. </span und><span class="unchn">以上各词均指事例、实例、例证。</span unchn></span undes></div para>\r\n' +
    '<div class="para" outdent="y"><span class="sym_unpara">☽</span sym_unpara> <span class="unsyn">example</span unsyn> \r\n' +
    '<span class="undes"><span class="und">something such as an object, a fact or a situation that shows, explains or supports what you say; a thing that is typical of or represents a particular group or set </span und><span class="unchn">指实例、例证、典型、范例、样品：</span unchn></span undes>\r\n' +
    '<div class="x_g" eid="example_xg_17" id="example_xg_17"><span class="x" type="unx">Can you give me an example of what you mean? </span x><span class="tx">你能给我举个实例来解释你的意思吗？</span tx></div x_g>\r\n' +
    '</div para>\r\n' +
    '<div class="para" outdent="y"><span class="sym_unpara">☽</span sym_unpara> <span class="unsyn">case</span unsyn> \r\n' +
    '<span class="undes"><span class="und">a particular situation or a situation of a particular type; a situation that relates to a particular person or thing </span und><span class="unchn">指具体情况、事例、实例、特定情况：</span unchn></span undes>\r\n' +
    '<div class="x_g" eid="example_xg_18" id="example_xg_18"><span class="x" type="unx">In some cases people have had to wait several weeks for an appointment. </span x><span class="tx">在某些情况下，人们必须等上好几周才能得到约见。</span tx></div x_g>\r\n' +
    '</div para>\r\n' +
    '<div class="para" outdent="y"><span class="sym_unpara">☽</span sym_unpara> <span class="unsyn">instance</span unsyn> \r\n' +
    '<span class="undes"><span class="und">(<span class="unei">rather formal</span unei>) a particular situation or a situation of a particular type </span und><span class="unchn">指例子、事例、实例：</span unchn></span undes>\r\n' +
    '<div class="x_g" eid="example_xg_19" id="example_xg_19"><span class="x" type="unx">The report highlights a number of instances of injustice. </span x><span class="tx">这篇报道重点列举了一些不公正的实例。 </span tx></div x_g>\r\n' +
    '</div para>\r\n' +
    '<div class="para" outdent="y"><span class="sym_unpara">☽</span sym_unpara> <span class="unsyn">specimen</span unsyn> \r\n' +
    '<span class="undes"><span class="und">an example of sth, especially an animal or plant </span und><span class="unchn">尤指动植物的样品、实例：</span unchn></span undes>\r\n' +
    '<div class="x_g" eid="example_xg_20" id="example_xg_20"><span class="x" type="unx">The aquarium has some interesting specimens of unusual tropical fish. </span x><span class="tx">水族馆里有一些罕见的热带鱼，很有趣。</span tx></div x_g>\r\n' +
    '</div para>\r\n' +
    '<div class="para" outdent="y"><span class="sym_unpara">☽</span sym_unpara> <span class="unsyn">illustration</span unsyn> \r\n' +
    '<span class="undes"><span class="und">(<span class="unei">rather formal</span unei>) a story, an event or an example that clearly shows the truth about sth </span und><span class="unchn">指说明事实的故事、实例、示例：</span unchn></span undes>\r\n' +
    '<div class="x_g" eid="example_xg_21" id="example_xg_21"><span class="x" type="unx">The statistics are a clear illustration of the point I am trying to make. </span x><span class="tx">这些统计数字清楚地阐明了我要陈述的要点。</span tx></div x_g>\r\n' +
    '</div para><div class="althead">example or illustration? <span class="chn">用 example 还是 illustration？</span chn></div althead>\r\n' +
    '<div class="para" outdent="n">\r\n' +
    '<span class="undes"><span class="und">An <span class="arbd1">illustration</span arbd1> is often used to show that sth is true. An <span class="arbd1">example</span arbd1> is used to help to explain sth. </span und><span class="unchn"><span class="ast">*</span ast> illustration 常用以表示事物的真实性，example 用以解释说明。</span unchn></span undes></div para><div class="patterns"><span class="title">PATTERNS</span title>\r\n' +
    '<div class="para" outdent="n"><span class="sym_unpara">☾</span unpara> \r\n' +
    '<span class="und">a(n) example/case/instance/specimen/illustration <span class="arbd1">of</span arbd1> sth</span und></div para>\r\n' +
    '<div class="para" outdent="n"><span class="sym_unpara">☾</span unpara> \r\n' +
    '<span class="und"><span class="arbd1">in</span arbd1> a particular case/instance</span und></div para>\r\n' +
    '<div class="para" outdent="n"><span class="sym_unpara">☾</span unpara> \r\n' +
    '<span class="und"><span class="arbd1">for</span arbd1> example/instance</span und></div para></div patterns></div unbox></td></tr></table></body>\r\n' +
    '\x00'
    */
