import { parse } from "./parser.peg";
import { expect } from "chai";
import {
  CSSMediaExpression,
  CSSStyleExpression,
  CSSLiteralExpression,
  CSSKeyFramesExpression,
  CSSStyleDeclarationExpression,
} from "./expressions";

describe(__filename + "#", () => {
  describe("smoke tests#", () => {
    [
      "color:red;",
      "color:#F60;",
      "color:#FF6600;",
      "--webkit-pointer-events:none;",
      "background-color:black;",
      "color:red;background-color:blue;",
      "background-color: #CCC; width: 1024px; height: 768px; display:block;",
      "display:block; width:110.422px; height:50px; ",
      "/* comment */"
    ].forEach(source => {
      it(`can parse ${source} declaration`, () => {
        parse(`.style { ${source} }`);
      });
    });

    [
      "audio:not { }",
      "audio:not([content]) { }",
      "@media screen { }",
      "@media screen { div { color: red; }}",
      "@media screen { div { color: red; }} @font-face { path: url(); }",
      "@font-face { a: b; c: d; }",
      "@animation { }",
      "@-webkit-key-frames { }",
      ".style{color:red;font-size:14px}",
      "audio:not{}",
      ":active{}"
    ].forEach(source => {
      it(`can parse ${source} style`, () => {
        parse(source);
      });
    });
  });

  describe("declarations", () => {
    it("can parse color values", () => {
      const style = parse(`.style{color:#F60;}`).rules[0].style;
      expect(style.declarations[0].value).to.be.an.instanceOf(CSSLiteralExpression);
    });
  });

  describe("rules", () => {
    it("can parse a simple class rule", () => {
      const expr = parse(`.box { color: red; }`);
      expect(expr.rules[0].selector.toString()).to.equal(".box");
      expect(expr.rules[0].style.declarations[0].key).to.equal("color");
      expect(expr.rules[0].style.declarations[0].value.toString()).to.equal("red");
    });

    it("can parse multiple css rules", () => {
      expect(parse(`.a{ color: red; } .b{ color: blue; }  .c{ color: blue; }`).rules.length).to.equal(3);
    });
  });

  describe("selectors", () => {

    [
      // individual elements
      [".a", `<div class="a" target />`],
      [".a-b", `<div class="a-b" target />`],
      ["#a", `<div id="a" target />`],
      ["#a-b", `<div id="a-b" target />`],
      ["*", `<div target /><div class="a" target /><ul target><li target /></ul>`],
      ["a", `<a target />`],
      ["div", `<div target />`],
      ["div, a", `<div target /><a target></a><strong>test</strong>`],

      // nested
      ["a > img", `<a><img target /></a>`],
      ["ul > li > a > img", `<div><img /></div><ul><li></li><li><a><img target /></a></li></ul>`],
      ["div img", `<div><img target /></div><div><ul><li></li><li><a><img target /></a></li></ul></div>`],
      ["span > *", `<span><img target /></span><div><span><p target /></span></div>`],
      ["span + img", `<span></span><img target />`],
      ["span ~ img", `<span></span><p></p><img target />`],
      ["footer > img + span", `<img /><span></span><footer><img /><span target></span></footer>`],

      // attributes
      ["*[target]", `<div target /><div />`],
      ["div[class=test]", `<div class="test" target /><div class="test2" />`],
      ["div[class^=test]", `<div class="testttt" target /><div class="teb" />`],
      ["div[class$=test]", `<div class="a b test" target /><div class="test a b" />`],
      ["div[class$='test']", `<div class="a b test" target /><div class="test a b" />`],
      ["[class$='test']", `<div class="a b test" target /><div class="test a b" />`]

      // pseudo - TODO
      // ["li:first-child", `<ul><li target></li><li></li></ul>`]
    ].forEach(function([selector, html]) {
      it(`can parse ${selector} { } and select the proper element`, () => {
        const expr = parse(`${selector} { }`);
        const rule = expr.rules[0];
        const div = document.createElement("div");
        div.innerHTML = html;
        const nodes = flattenNode(div);
        nodes.shift(); // remove the initial div
        const targets = nodes.filter((node) => /^#/.test(node.name) && node.hasAttribute("target"));
        const matches = nodes.filter((node) => /^#/.test(node.name) && rule.selector.test(node));
        expect(matches).to.eql(targets);
      });
    });
  });

  describe("@media", () => {
    it("can be parsed", () => {
      const stylesheet = parse(`@media (max-width: 1024px) { .div { color: red; }}`);
      expect(stylesheet.rules[0]).to.be.an.instanceOf(CSSMediaExpression);
      expect((<CSSMediaExpression><any>stylesheet.rules[0]).query).to.equal("(max-width: 1024px)");
    });
  });
  describe("@keyframes", () => {
    it("can be parsed", () => {
      const stylesheet = parse(`@keyframes test { from { color: red; } to { color: blue; }}`);
      expect(stylesheet.rules[0]).to.be.an.instanceOf(CSSKeyFramesExpression);
      const keyframes = <CSSKeyFramesExpression><any>stylesheet.rules[0];
      expect(keyframes.keyframes[0].start).to.equal(0);
      expect(keyframes.keyframes[1].start).to.equal(100);
    });
  });
});

function flattenNode(node: any): Array<any> {
  const nodes = [node];
  if (node.children) {
    for (const child of node.children) {
      nodes.push(...flattenNode(child));
    }
  }
  return nodes;
}