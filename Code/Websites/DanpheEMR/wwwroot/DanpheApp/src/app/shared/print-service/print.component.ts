import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-print-page',
  template: ''
})
export class DanphePrintComponent implements OnInit {

  public printData: any;
  constructor() { }
  @Input("print-data")
  public set value(val: any) {
    // this.printData = val.innerHTML;
    this.printData = val.innerHTML === undefined ? val : val.innerHTML;
  }
  @Input("print-data-header")
  public set printvalue(val: any) {
    this.printData = val;
  }

  @Output("print-sucess")
  printSucess: EventEmitter<string> = new EventEmitter<string>();

  ngOnInit() {
    console.log("app-print-page called");
    this.print();
  }

  print() {
    let contents = this.printData;
    let iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    let documentContent = "<html><head>";
    documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/PrintStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css" />';
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + contents + '</body></html>'
    let htmlToPrint = '' + '<style type="text/css">' + '.table_data {' + 'border-spacing:0px' + '}' + '.no-print{display:none;visibility:hidden;}' + '</style>';
    htmlToPrint += documentContent;
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlToPrint);
    iframe.contentWindow.document.close();

    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);

    this.printSucess.emit();
  }
}
