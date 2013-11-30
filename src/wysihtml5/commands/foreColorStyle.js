// /**
//  * document.execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
//  * which we don't want
//  * Instead we set a css class
//  */

// import { quirks } from "../quirks";
// import lang from "wysihtml5/lang";

// (function(wysihtml5) {
//   var REG_EXP = /(\s|^)color\s*:\s*[^;\s]+;?/gi;
  
//   wysihtml5.commands.foreColorStyle = {
//     exec: function(composer, command, color) {
//       var colorVals  = quirks.styleParser.parseColor((typeof(color) == "object") ? "color:" + color.color : "color:" + color, "color"),
//           colString;
      
//       if (colorVals) {
//         colString = "color: rgb(" + colorVals[0] + ',' + colorVals[1] + ',' + colorVals[2] + ');';
//         if (colorVals[3] !== 1) {
//           colString += "color: rgba(" + colorVals[0] + ',' + colorVals[1] + ',' + colorVals[2] + ',' + colorVals[3] + ');';
//         }
//         wysihtml5.commands.formatInline.exec(composer, command, "span", false, false, colString, REG_EXP);
//       }
//     },

//     state: function(composer, command) {
//       return wysihtml5.commands.formatInline.state(composer, command, "span", false, false, "color", REG_EXP);
//     },
    
//     stateValue: function(composer, command, props) {
//       var st = this.state(composer, command),
//           colorStr;
          
//       if (st && lang.object(st).isArray()) {
//         st = st[0];
//       }
      
//       if (st) {
//         colorStr = st.getAttribute('style');
//         if (colorStr) {
//           if (colorStr) {
//             val = quirks.styleParser.parseColor(colorStr, "color");
//             return quirks.styleParser.unparseColor(val, props);
//           }
//         }
//       }
//       return false;
//     }
    
//   };
// })(wysihtml5);