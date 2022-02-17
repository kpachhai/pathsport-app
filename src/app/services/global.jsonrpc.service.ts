import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from 'src/app/logger';

type JSONRPCResponse = {
  error: string;
  id: string;
  jsonrpc: string;
  result: string;
};

@Injectable({
  providedIn: 'root',
})
export class GlobalJsonRPCService {
  constructor(private http: HttpClient) {}

  httpPost(rpcApiUrl: string, param: any, headers: any = null): Promise<any> {
    let httpOptions = null;
    if (!rpcApiUrl) {
      return null;
    }

    console.log('headers from POST waqas: ', headers);
    console.log('param from POST waqas: ', param);

    if (!headers) {
      httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      };
      console.log('httpOptions from if: ', httpOptions);
    } else {
      httpOptions = {
        headers: new HttpHeaders(headers),
        observe: 'response',
      };
      console.log('httpOptions from else: ', httpOptions);
    }

    console.log('rpcApiUrl: ', rpcApiUrl);
    console.log('httpOptions: ', httpOptions);

    return new Promise((resolve, reject) => {
      //   const httpOptions = {
      //     headers: new HttpHeaders({
      //       'Content-Type': 'application/json',
      //     }),
      //   };
      // Logger.log("GlobalJsonRPCService", 'httpPost rpcApiUrl:', rpcApiUrl);
      this.http.post(rpcApiUrl, JSON.stringify(param), httpOptions).subscribe(
        (res: any) => {
          if (res) {
            Logger.warn('GlobalJsonRPCService', 'httpPost response:', res);
            if (res instanceof Array) {
              resolve(res);
            } else {
              if (res.error) {
                Logger.error('GlobalJsonRPCService', 'httpPost error:', res);
                reject(res.error);
              } else {
                resolve(res.body || '');
              }
            }
          } else {
            Logger.error('GlobalJsonRPCService', 'httpPost get nothing!');
          }
        },
        (err) => {
          Logger.error(
            'GlobalJsonRPCService',
            'JsonRPCService httpPost error:',
            JSON.stringify(err)
          );
          reject(err);
        }
      );
    });
  }

  httpPatch(rpcApiUrl: string, param: any, headers: any = null): Promise<any> {
    let httpOptions = null;
    if (!rpcApiUrl) {
      return null;
    }

    console.log('headers from PATCH waqas: ', headers);
    console.log('param from PATCH waqas: ', param);

    if (!headers) {
      httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      };
      console.log('httpOptions from if: ', httpOptions);
    } else {
      httpOptions = {
        headers: new HttpHeaders(headers),
        observe: 'response',
      };
      console.log('httpOptions from else: ', httpOptions);
    }

    console.log('rpcApiUrl: ', rpcApiUrl);
    console.log('httpOptions: ', httpOptions);

    return new Promise((resolve, reject) => {
      //   const httpOptions = {
      //     headers: new HttpHeaders({
      //       'Content-Type': 'application/json',
      //     }),
      //   };
      // Logger.log("GlobalJsonRPCService", 'httpPost rpcApiUrl:', rpcApiUrl);
      this.http.patch(rpcApiUrl, JSON.stringify(param), httpOptions).subscribe(
        (res: any) => {
          if (res) {
            Logger.warn('GlobalJsonRPCService', 'httpPatch response:', res);
            if (res instanceof Array) {
              resolve(res);
            } else {
              if (res.error) {
                Logger.error('GlobalJsonRPCService', 'httpPatch error:', res);
                reject(res.error);
              } else {
                resolve(res.body || '');
              }
            }
          } else {
            Logger.error('GlobalJsonRPCService', 'httpPatch get nothing!');
          }
        },
        (err) => {
          Logger.error(
            'GlobalJsonRPCService',
            'JsonRPCService httpPatch error:',
            JSON.stringify(err)
          );
          reject(err);
        }
      );
    });
  }

  httpPut(rpcApiUrl: string, param: any, headers: any = null): Promise<any> {
    let httpOptions = null;
    if (!rpcApiUrl) {
      return null;
    }

    console.log('headers from Put waqas: ', headers);
    console.log('param from Put waqas: ', param);

    if (!headers) {
      httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      };
      console.log('httpOptions from if: ', httpOptions);
    } else {
      httpOptions = {
        headers: new HttpHeaders(headers),
      };
      console.log('httpOptions from else: ', httpOptions);
    }

    console.log('rpcApiUrl: ', rpcApiUrl);
    console.log('httpOptions: ', httpOptions);

    return new Promise((resolve, reject) => {
      //   const httpOptions = {
      //     headers: new HttpHeaders({
      //       'Content-Type': 'application/json',
      //     }),
      //   };
      // Logger.log("GlobalJsonRPCService", 'httpPut rpcApiUrl:', rpcApiUrl);
      this.http.put(rpcApiUrl, JSON.stringify(param), httpOptions).subscribe(
        (res: any) => {
          if (res) {
            // Logger.warn("GlobalJsonRPCService", 'httpPut response:', res);
            if (res instanceof Array) {
              resolve(res);
            } else {
              if (res.error) {
                Logger.error('GlobalJsonRPCService', 'httpPut error:', res);
                reject(res.error);
              } else {
                resolve(res.body || '');
              }
            }
          } else {
            Logger.error('GlobalJsonRPCService', 'httpPut get nothing!');
          }
        },
        (err) => {
          Logger.error(
            'GlobalJsonRPCService',
            'JsonRPCService httpPut error:',
            JSON.stringify(err)
          );
          reject(err);
        }
      );
    });
  }

  httpGet(rpcApiUrl: string, headers: any = null): Promise<any> {
    let httpOptions = null;
    if (!rpcApiUrl) {
      return null;
    }

    console.log('headers from GET waqas: ', headers);

    if (!headers) {
      httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      };
    } else {
      httpOptions = {
        headers: new HttpHeaders(headers),
      };
    }

    console.log('rpcApiUrl: ', rpcApiUrl);
    console.log('httpOptions: ', httpOptions);

    return new Promise((resolve, reject) => {
      this.http.get<any>(rpcApiUrl, httpOptions).subscribe(
        (res) => {
          // Logger.log('GlobalJsonRPCService', res);
          resolve(res);
        },
        (err) => {
          Logger.error('GlobalJsonRPCService', 'http get error:', err);
          reject(err);
        }
      );
    });
  }
}
