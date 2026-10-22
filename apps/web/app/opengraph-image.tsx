import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Postdiff — turn finished work into posts that sound like you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const movatif = readFileSync(join(process.cwd(), "app/fonts/movatif-light.woff"));
// Geist Mono v6 (latin, medium) — SIL OFL, github.com/vercel/geist-font
const geistMono = Buffer.from(
    "d09GRgABAAAAADKIABAAAAAAUVQAAQABAAAAAAAAAAAAAAAAAAAAAAAAAABHREVGAAABbAAAAFMAAAB0CcEJ8UdQT1MAAAHAAAACSwAABMjU8tiwR1NVQgAABAwAAAErAAACKgLkEERPUy8yAAAFOAAAAFcAAABgWMT12VNUQVQAAAWQAAAAOQAAAETlPsxAY21hcAAABcwAAAHEAAACkC4uUGVnYXNwAAAHkAAAAAgAAAAIAAAAEGdseWYAAAeYAAAjiAAAOEwJW2UCaGVhZAAAKyAAAAA2AAAANiz52ipoaGVhAAArWAAAACEAAAAkBkYD5WhtdHgAACt8AAABNwAABBA3EFwfbG9jYQAALLQAAAH+AAACEh8oEF9tYXhwAAAutAAAABwAAAAgARcApG5hbWUAAC7QAAABHQAAAmw0M2MccG9zdAAAL/AAAAKQAAAEQ8EjYEFwcmVwAAAygAAAAAcAAAAHaAaMhXjaJYqBBYAAEADvixASaIk0R4LGSEgDtGrQCClUgY7+3P3jCRIK/um9c4JaG1rbMdiRyc4sdpVgk2CXlIPTXrw2FCotwR3yauanf1zcPB9JnROzAHjadZIDjJhREIRnXm2cbRu1bdu2zaC23ahRo4saNbqgdoOaMWu78zZnZLLf7r/4tQ8E0BjJ6A3Xu+/g0Wi+eMbqpWiOusrj3z84OcItmbFyEYKXLFqySDXASXWAkmpddx+zdYfGqI+WoLwDXRGSxdVoqs5ATTUEme6+iXQvxNHuFajaR3zCj7JJgnVz6+aKiZrUvUFm/ptv70N/Dzeab8VIVdfzOR/KvO6X+Ju8LPmomBdZLF0oubZe6yzieZ7jWcWV82KJjtdcseuD3M2D0lZP19P15GZuFtdyOddKC/nc5XI2p3I8R8rGKxrMvuzOjixkNlNdutST8TYbKZaIwWzJxqyLv6wrfi/JttQdW7pcfORzkIVuiZjsXhlfGAPFVGO2cZQxUz2i9fS1TKi7CmKHJw/4vBhovC4OUr+ovGj5gT6Po9af7fPiM2Nrsb31RGpKVFW0TIw95YQnA4136hzytLhznaPGw57umphj+TRjZp0jxkOeyjg0AJEBIAv95AdgLvpiPhZjNpZiIxbgmbQWr6V1qA8gX5YpSy6JY2XhIDPs3bKMNI42Znpq8r2dw2/4jh/lZ03nZK54Fk2xlsdr0GjJ+6Fl6l+loyc7i7WpLXNrraVXlGUSpeOMLpXi0GpToabWHM2mrC/VdGewLX6yf5ksi89ezMVbxWQhJojXAXG2sbkxw5hjLDBm/lso5lnc3hhqzDJmG3sYI4zJxs7GjqLzfxq+Fo0Meb/pNNt0b9v0TNv0PNv0atv0GhDQzshMeUo//wOGtdd9AHjaTY2zQrBxFIef8+pDtm1jasm2OeUla8tca60b6ArS1MW0Zy3ppPePg+d3gAD/meUco6KqoYOu8YH5SbxpwCntq4yloLyt493Wl/a926aGilhSO0o/SEdb/buF11dsQDCwsN05JjYWKLNQho0zNDQxTc3w5NQEZaOzA0MUjE8NjZOvNnNyYWKWZECw1ZpoJ2Dyh7/809xRCx4SLQ5PnHHILutMvttkQlUT/iIUvT5otfHO/2Mi+CNkqw7/MRB22AXVIlV3a3vsay4cuKY6rxfKjl0skP/uCgK1f4lt+OEGkRhE0YfzXal7EvFHVO1BsBDaEdBvoYRQN/npHsZG8NU56F7RSa304OCrsz0BExDdko526+1BOfGqfXOHK2645ZEnnpW0vgEp6TcLAHjaY2BhimD8wsDKwMDUxRTBwMDgDaEZ4xiMGO2BoowMnAxg0MDAkA6kshigICzI2YfhAIOCkhDz2383GRhYHBi7FBgYpp+/BtQlwnQMqESBgQ0AcIcO3wB42i3DMQ5AQBQFwHmfwgG20+JeKiTKTVzcATQmGRGTQlNY1HOcPbj6fmcVzWgQlQ3kL3NePq/ABS0AAAB42m3LU9hVaxgF0PHtFY+za+0/2+7Ytm3bvD3Kusm2bdt27Z5s2/aLOa8GEoiQXSSc63SJP1BHLJ38yqvpLz2dColQMTyfGJmYnFieWBmFKF2UOSocZ4/zxgXjtLhYXDmuFT8Q90ymJRslm6RlPXUKsQpqaav3Of3cJS2KokxndLY4d5z/nK4U17xOPwmcCqeSnHz8ZJ2TJU+WOLH3xH5OLEl1gVTj1D+pTmfy5VSlNQPWvLnmjdVzBXXwipTDEJoDQKgL4b9Q342nqz5mGWyVHeaabZTRBlmrh2G6G6KnXjbZYKN+5ghucrNb3S67HHLKJb+CCoklFVZaWeWUV0FF1VRXQ021jTPUeNuMDNTxgAc97FFPedoznvWK173hTW95xyc+87kvfOVrP/jRT372mzGWGWuLbvpaYY2VUpab75QFfjfNVgtDeott1k77EGw3z4CQQVt/mK6VllrrL4OEdDJJL6PMbpHNHbLIKp/c8sjrNmmKK6KokopZp4SqKqmsilrK+NI97nSX+9ztXvd7yJMe87gnvOx5L3jRI972gXe95yPvW+9D3/vGt77zi0/9qpSP7XbEFFNNMMlkE08DNjaOkAABAAH//wAPeNqtOwdgG8eRtwcREKsAAiBY0QkQHcShEY0ACIIN7ATFLnaKtKhCddkq9kuyHMvdcUuzFVtO5JKudNd/ueX9buk9cbqSly25JDGPP7sHHklF/i7p7nCzu9N3ZnZvRdGUa2kOPSNQUwJKRFEKiUZSqZFoXOhW9hSysm/cJTj7QbNL0EVBz2K4RelzlJDKoShGykh1AoHPp1EUv3LilfmHHxapEaWmzy0G6P7Fh78+Nra0xI0QnKQMFKIowH+RslBf5OG38vB34L4Cv42HXwLYCvwgD7/A91+L/+2lH6yCf56Hvwv3K9F9D8NBsmyAJ0GyDZQUS6aR6+QMuTQSHYjIyLNfRVMP3HXXZ9i3JV/Ql91Ln5v4t9FXJ+jpxftAUAp01w0Y7IBBQpVSOsAhYVxFcplQKPK4ivAPnZFxeT1ug07nWf7R/fLuA1Wtnli//dpdBw/Vx+vjh2bikUh8hj43PWitNyGhpZUZmRn3VbsDYx5ntYcCrvVLF4DO96gKisrSGgwet9cLlBQig0GnFQrlsqIiQO9TCIXI0bs3EtnbO3ZMvnVDC+NO6vVJt68tf77wuHjg9MLO04NHdgqbW6MH+jbuj/Z0Zh04sbQE2NUEu4HKpSiw898FIBaRzQ2y5VBSTjIi0SqRuh8bubGl5caRRGxsdnYsRp/r/tTCwie7Jg4fOXItYBVz4wFrPsG6eKIAJOkDqAyguRinRr78tw99mf0KqmWfRt0ZLQMG0ldwE2DYkPGjIPUlHn47D78EzxX4IR5+gRLzcB4P8ZffU18CXsYBriQScrz48E0yjr7FHrajGPskfW7Mzr4/yn43YwEr1tEaC1xuAq8PDC3RGX0FNLK07klE93bXTddvmN/QUONqqDQ0ue3xSvrji+msstzqNnHPQ/vBIIG5BlGsrRZbpNaR9g+yd30aMV0OoOkH/tTEP7H+JUaNCO46iQIY9c860C7H7KyDPemgz7FnDAbUuxhAAwYDexpGtsHInIyWMUMe8G0JI287cwZ968yZCZqamGCpCQp0Q3qSuaRYmas8/DYC5+ckDz/Iwfk5uRYPPyeBEwPojQJOxJzejD6iJw8IIhMiacNskN5Mx+Px2OwhcXihbX13R3sH+i5r2XcD4MRjOwjO8gxv3wGcAqIXF+AUAAwk9HkQgwChRuBDdyPZYbZgFhX9qhHJv/dRNLgYwLEJjTSyA6ssLlzWqHx8NorugC7jwQlod0J7FafxSoEPdA3RTkp0LkDrDuROnTxadfTkVO6BXvQBWnwMhv2GLgMK3YhdB6MTq3wbRhJrAZbEkb8XzsAF3R9aR2+C/oNZi/eDfKQ/iUuaNXEJ+5qb/h5woVrrbXj+GcHLPO4Vr0PW9O5IZHc6vScc3pN21ev19S5yF/ee3rPvdG/v6X17TveOhw4MDFwdDl89MHAgBHbnaBDd6lbszsNvI3De7jz8IAfn7X45Hj4W8zJwcCHFUitUb+WgvMQCKgfgbRmJLZCPtCAySKyk5bIC+nKJFZKVSP0GDj2ORmdxsbPRZrBIpRaD3iqVWu9A6P477/yM+Ftnzz7hm7q+s/P4pG88tH9w6EAodGBocH+oKxNmcKTrzVg9j5KviXQ6iWQ51vX+pHlbOLyteefmVGNjajN9zjuRSEx42ItoeyQYinBYOK+UUgrsk3zg59Fhf9jxbGNTU+Oz/9y5PRTa3vnz2TvGI+FgcNw9mkhMerAfBigBaOkGojsB4NKDBwgYqfEfvCBCr/GCbbv7d31stScYAkbZsivsRf3swzNr/EFdN93AOcTQ/iBwXwfclwL3RZRqdR4zgroVOqOdXq2Mup/uuNbWZFrX3CQsnBULil3WaxbiyWR8gT63MM60WQV5gnDixbM6cyH7J7Q34q8J4xxmARvbQCrnciRQ0kzGsoB/JaACLS1nZyWNeUCe1p0J4RaROWGzhtTKtpamIXPNVS3Ns2HRlixdyBysL0/WpietkW3iyLZmEZPUKaxqtd0olzEtvvCwOzBTLzRFdH6H0qQqVIS7AoGBasxPFUjsBIlFFLUcId9/hV7/Cj0xMbH4CdwjABzjaCEhHJOYtSp4WReOzCbr6pKzR8Qnr0b/xtraurvb0Ots9dUnwdPJWDIvqlfmFw+/jcD5+cXDDxI4P7/W4lkTV8uA+3CGewGJUoK/vL7ti+ovbnsdvOgWegd4EsJxkw7heMb3Ij11AkawOTUbzGseas4LzqZuaChugFG30urFX9DbIUCtX3wfRttgtCUTz6QwHEbi4s/2za/tPX5899e+ufeGj6ApNMb+O5Kwn2Q/juTsn2BUJYxiYNR6rFdulOT913fdcceu15AenWJfRF52hP0JyEZ6EtlqVnS0Kgpn4+yFNGAapJE70T72PvQz9gZ0eBItTUyyiMxdZukS9FUDDhfEDW6W+HxuPDFERuJScvAlhpHDBMRex2TiiUdEJs6brg5Hd8+jXq/LnzO3Ydfg9FXiDUphWb7eVUKLha42tTOuudNpsOfp49ZESqyPROwmUWpk1/RrhRu6EV3MGHV+dbc2YjYpsw0qjQGk4jj6EXAUIpHvYhnFQ3/OQy/9+wr0JR564QJ1BQxvP78CZXnou6v6/oyHvgeOs44SA7QRtCKn7KDbKOe/bi56yHV8tai5or5EOLzwGvIxJMqgU939/d1Ms+mioEpTWrF+vLCFfUQX1KbqOpVqVYlwJL813pKy5DRVmXW1erXqxZsF+nKNLu+2Y8duq9kzYG1p19vW97eqEt54Oje/Oeo0CtO927c9HWvpbkzKcoVVan3lpebaWmzTLuDeTWKRfjlWiHQ4XUdoPv6RUMRHv15r0pmXnzUylZNtb7AkJr3eyXRtMhm2RXW62jylXy85DFXS9+QVLnXdwd7eg3XDE70bx61dwZpuG57pUaCoBn1VXLG6AxJEYQU08jfvCId3NIdHIzkzeXFHXWtrnbM+dyYnOpZXf7Cn55qkrTckYrwTvb0TNX5huN8FNgLsgJv4aD1XXyMspR5oCnkp11DFhYNRsSbzAQ+IJoIlrEl7ds7USFZ+bnWyzFqr00Vt4WQyjxNM7aqQI/Ni4LBE71cO27prgl3W8Y29E9grAkDRRL8GeaWAy7NSY6VCYKchFAvkAp4DJb1Gw0D5vWJUXTKDavaNlI5c16m/2DwfDs83efvjutDWplhTUyze1ESL4rvi7MmD93et78lpu+b+YfZiZGdb+0LE3txTmd4XHertbejuaW9Lg+yEEyVoREEpL6tw5BreOwUazvOqW7YBuebkfJg9ltVS64jkzSr2/BrlZTV6/Q15iUNY7XUH+8pT7Ta9KDWImhLxBGido/ED0HoTNw9tLA/9GQ+9RK9AX+ChF3joagxv/4il6JUqj6vLYVYxcqwmiQAC1SvNbY+eUqreQs/TzuZUWqdafBU9mSYye5dG6GKQWU3Z1tbCHhKa+EWdD7ILCA868PKWN4VGwnlzuX5vXYO00xPfHKiZjvnTUjQWuKolkkJIV2uONTSdMiTtIo3B72szOeM7W9p2xRlrN1taN+xExX3t3paq/o72PgpRw8BOLvE8ilk1raDM5QwuGZ7KyXEmTP5W4xTjqknC1PnROouvlBkMsp9F4ca6xiR7DvSTIiu8F0E/XUQ/b4ExUQYqo/K4tYcCUqsENKRLveJ4B1m/+MXpNLrHnmZjaR7Dj3gMF5soHvpzHnpJuQJ9iYdeUFFX5uEKeN9+D0Pn8J4H6dvP9R0DfjNQGcwJSkGqNlhgAcuweJ87ZTI62N+hju6+u9J6J/qRPb341/YeDhMtJvj7M5nrJIVxdQBdB78CkEgZkVRnFMk7pi5c+8oP9z40ApqMo7xfsS//ZeJG6Mqv8IgvVUqW60W5JAsnvfU61YFjre3sS+j3anqDSpdub118V429CVF6IiHEFEJJYeR8R0cevCWFq3/p+9bl5gRtzmphbnbUWVszXlZeWCEeLamQlkto2T4o2RJ10YaN4+y9qDfqKmZM7KOoN+ImP5ZlW0/mLEeR9xqeQsewIDeHaTaH2qqmPJ7KoJ6W3bi+ulblGazBflOfVNfa2X8BS3C4yCwc4bLWEjdDLtFaWg26KFsbFS6PR8jKVePcva6pqQ4uHAnSBxOJg+meQ4nh8Y0bx/EF1Di8xFqjnJdZVqA/56GXllagL/HQC9SVMLz9Aw76NkC1PPQDiub7/oyHvkfh2JsD0HaSkXUUQwU+PCMD9MPWenwu/mzX4GCXu8XI5eLsMcjF59r7+9tdKbM5VV2kEotVRUUqiUT11M3rKpVKXd7dh6/9aGhPnyWThW8/evR2SBedhxqGTd3hcLfZ0hUOd5n/COUstkMjeLc5wyul4LyLX8WQwCXxrcm/jaN0nmww0jrudI63mpLVufk3Rhsbo+aITlt7F31mvzASaz3U0nKotYzRF7Dv/m60v3/U1BWJdJmAWhNQs5BoZABqfDxaS22tHppmcnOc9ea2MbtjNGVOOvPzj1dHyssj1a6IUll7l2CI/YFcVV3RdqgZaJa6dIXsO79jelzuNONJu6rTDFC1kxmckTFLJ4FsuzoIi3yMYE3ypcVTON+aUhNO50SqdlCaR49esES0uogZRL0L5RTomTJOyFhEuJ8Nc/JhSSlE9YBatRBjiklMFOGgyGmVkXNTx8jIe75it3/l+9nZorrQjnmDu8z+RtqOztnTd4oakn0VNWb2T3Yy81vAk/KBc/vaLPJfLqPcDdP+dTPro0FfQObztPcbHEOJhiG3aEaodGk8rmK/s7NP7xvLc3a6hBZGqZaVSXM2mGpt9mZLdZtdWGpUmJXFFdLsfFPI6qyvBE6SpE5/hTKTPEgIAyWRkRDktzwN/C+SW5K+6frp7b2NKDToOro/Gm1ogx1Km8Uf8dX469AfGjb7p9N1G4USQXWPd/iqTf6A0VM24q+2epK1rBwIktVBHn0bFzM1/LqMkSMcM/d1tk/pdDewevSTljb0PptfqU9zGRhR6aVLiAUryMDPLlvP6Yww+djWoSkX46ub2oQKCgbyZjehPvaZxnhzAgUWz98orE8tLXE4SCTYxsUSPcVDf85DL/11BfoSD73wN+oKGN5+jeLXWjKyM8Utmv781Pztt88/RcvYjeizi+ehTyH0SZLMyvUh3WBBtn9mrjbZm6ydm16Ix6H/FOpgP48+tnge+dgXYJwDxplgXGYdpwDfxmnJ8czXFq47vOurT+2EdZwECZ54gv07+9Z3vkMhMjvMMEKcyYk+n45jCqbktbGycpFE88yWu2/a8oY47r8rLZE6aJodRp9e/LzTDBKS0UTCvZyOrBQPfYmHwr4gv1MpW7vWa0Nx9nl0hv02atmERtOb2PtJBXUA7UOvwA6CHksk1f4XSz2PYs065i1vrMY7ryorVWZtyu6Mp1LZ2TkCWZ5MJxOtD2v0jtZihQztc1js1blFak2JYp23piGxtyA3iugCrXqd2hox6WWSLIVYIsW8HAJefgS85OJ8iAgvnPuvzVMdIyMdHSOb2g1ms8FoMqF9mzo6No22d2xK+lzV/hpntZ8SUE5Y41dl9nsgGvmQAin+i12/a5C4g70w2rYQCi20te8IhXa022AlUGuzwoonOofey2Kzd3Mb/oOndy6cHhiPHUhvPBCLHdiYPhBbVXnk4LpHIyFT1AvlGrGA5OyA0VnUxz6Bfo/+1q9wwXpiYoLiV+bfw/uVDHDn4zehRKtShKiAFsF63b57s81fWu43J1pz5nNP7E7NevU9TeFOE42ubr9m3qcwO7U6V0VjnWj2oHsk4utIGDW1NcWYDq8REuOWQxwfTLifa6mKPBxxZNh9TdZVwtYaY8JUWWfx+bR+TW0gBHtFuftnkzP+7vbeydhu8fZBUZgpdlst/rIRmV3vdrusou5pR28o3rlBmjPTlhhlyBqN/waST1GgGg9icC0rr2QkaA/7OGrYlU6zj/7prkHYs64eu+s9VIe59wP3WLf6NRGa1xR8aNKIViU5ZG6YDWfNi5L+2mZNyGysL9hmR9ezb1TIxUytun7GDztbUHqLfL7WBntCZ9TS6PaJdzYoq+SRrQ0N2yM4mwFFM7GLY7lyIvj57xOiD18727t2BpXxLe3xfl/BlhyPx9tqpUtzPR3uhplAdHsq3tpYa6s36uLi5lum+u7bFbe0ubIrbZFD4+t0ocrgfGP7jshER1OiXR+3WZNGsm+W2WXPz3gJ9qkCgfxrwe2t7EfQm7GRUPn8d5/vnxhqvu3OBwYoSsDzX0GZKA9f+/kUayaByPePlaB0zWxr2hkfbqNr22omY7Epf2uUbhuOLzTXdjU1NjR31TKRsNsdjoidI/Wt0xKZuC3u72OYPn+8TSwrnGqtH3GOByOB+vpAJIh63W6712t3u6nLtYsIM6Ra4B3Tt6p6UGBeeHdF5tXazYUObRa6NMfb4U5uDkR3tMRbmyJYuzH6e803T3+4eus6OPVCHP3I0vvoZXQjJaI+RVHstwFyGrjqRUcBcn8G8iBAvkL6PJCBfBxGfYtATmUgh0mffwLIpzOQT0GfrxPIgxnIRwHyNBn1UAbyMIz6AqEFVNknAHIX9HmG9HkY9wF93Q2QZwFSQhmIvkglx09jH3nxuFdrymtAtvpOTVNNOJLbkKUqr7QLcqzqcGtPTF9lqCzSyFAVunFoIDIZrHaKZHI/I1bUJWKNUZNWa5CoFVoT1gsKopfplykh1gvWCqpDvfRz8A5awTqB96+QdtAJ1gj0/xZ5B41gfZD2c/AO+sDagPavk3fQBtYFvD9N+oMusCZQHH2BtIMmsB6g/RnSDnrAWoD3Z+H9/1UL9Mv/mRaAqmHVtzEKQcZGPkaE0ifSJ9hr4IbOIWqJYgNL8Af3oJ2gISN1/xIshWHsx1iK+Mw+YmvhqvZNK+2gnxnSLoP2CEhopE4t7ePa87j2g+AHAt4iOEeWfXiWFBl9CljR9fU148tssZrMFodYfVKNgltGRq66amRkSzyRiMOn8kjzOuZ3Lgrxts0GrB4RKS8hImdPlFrtIVR3CQXsJvYaCvE2V0G9gCMRl7D4zEGiCi4PGPmDBRarq1CerS7WaLIahU3RSMJlNVeUfA3V2WOMoiynUCEpLlNrBcFELePwKYo26CVxCvFeVEXk40M9X/ReRoxEMGRpiwiaabVOo9dXlpaWKMvKyyvoFmFdqC6m11QbOlAwxAiKypVlpepwiaKovEyW5QgF7bqq7FxG642C2nlvJZkJeXQeH0M+iRkZD3J/5SutbveXZ1BdOnDpz7H0XcehC+/Pyss5BQZ1MFonWuYSVYUbslqy1GXqSpWqRJ3bUPzmA3m5VYpIqA0FfdXrior0OqVJJvlVdCg/v7mmtoGiudnBe7v2siMKPOqV3CMSFiFLomuNt+daVcveLtdKETKh4LK7y2V+RlJ0mbtTiJ+FeRkL63CuoeXny1z6syjH6K1A8eD2zY64t3p6Z4IS8LNUQekoxzKnPhy6eRNd7p++NTmmpcViVGrj8bqYVmmwNqd0WECjUVuqrCgrq1CC6dx6X0GOsdLh8TgqjTkbvHp3KFpWXlZZCbcvl5TAB7WikhLM++/htp06SgnIqlD++xNHjwL0j0sjaCtAYfYpfDqAi877A0cjp04d3f8YxBluFFoCPZ8he09wR1djOIzDcCMHgfGPkLhEvnMBPoAvRfEshSc37ikSpwg+fg8KlpAehlRxIniiHMF64bRQtG76xPe1IxNVb75ZNTGi/T7wSXP0aD03DjGw6JPrsNWN4EooJ7FOBAPXq06cQK38yL/icWEgWgbZVElpKcoHyl+ZkxF6VQ0pxwy8b4Ekmh+CrLz+KmHtfEti2lfqNZer8nad+NfmPlWRzlDuiNTXCePTAfdQyBxhyiR6h+5fgUFMaWkEKGmhqtCs7Cf5cJkrIwT4bX0pcI6UHG5zxfgyzaQI08w+ccrRW2ONekpL/Y6GHpVCZ1JaGY4m/c9AidjkL6D7HZw1qL+AFc9ST6JT6LNEp5fV8siq9qrhn8ajVnueVOEfKpVHo/aqYFwHKqbXc98cpUZsfgiOPoUIdKoQGV+Mj95zz2h8fCKGn7EJVGz9p45/st50E/fA+0xWENyaif/cChlyQKVPI8qCpwCeyHAkfYT9Qj56KZ+dvrbn8Cb8C394/nZ397fxE32xuxt759TS7egi/RfsnQrEoClkH2Vf2yoY+uDBy1qzdNB8ERpHoRW37aHeQb9CXbjNB9NxD9ryzvAwOX3xLnp3BT6O7nx3aAjgMupdOrECl9FODp5aepCGeU04AHgKPTVE4PcA7aeAtgRoc1sePoaYs0iBBlJpjSadmm7q0mq7mrbW33JbU9Ntt9Q33HpLY+MttzSuHa3QcQsYI8PtkbCZYdMEyVYYAINubcgggbFblo6j8/RbVCW3f0dKeg/5nMh/BsAhRF60vBRFdwx2yDwM45F1DPZ32CojDQ2RSlvHgYm2SbNLNiqvNk+2TwzbrBub0pCIept77dahtXQUXCLBUcpjAJL8HjGWl5FrhYTkv3DIk7WAvJ8neWDIagecMJfTTRuttuGJ9klztXxU5jJPtpF11lHQxRugCxHIo5GQQ0LoDdg76Dh/HmzZu9ixto+CO0skOXr+POrY2kt/vveDB5eWliMWH3Gug/fvwbuBeuQeCkM349l4HTqLvkf/BN5xxsIe7fHpuAd6A0e4k/hG/+TU0X2P44tgQvfDmHMQux5ZuoeOUyKgsBmeiLoAtesu+seUkMeFFsj4Hy/HyTdh7GYYK4Kxf6PjAElSKboQ/QT4eulezNdLM8AXDyV8VfqMjEIu0nAPJD1zZuGmm9inySP1/POfiX6G3LDuHqVS6FE8DkbpjB5cZj26cPPNC2dSuNdlPXwcwkfPnIEuHCJM+z7Uj54AHteRSkYAsR4wMQLUt26u+FLx3Dpont/GstvYOzC+S/A6Cb2zcF8IjgJEF2wvACA1P79EYnnh0q3kRGM93nHMIiUmvxTk60+8VuEDkkiUmTsMv8NAXkloJKdM+KUietzcamjaFXemF+o6twX0UavWKcoTaa0lTI0xbinRS1FuToswV1RYIC7bYOiIunrjenuPTxXVHtlQVpRXUgwH/UqapdKmTxza+fieYM8d4zuOBQJOWusoHuxI7KgvqizOHaq9qlup1Von0+17os6JO8anDwcKC++p8NRX2R3ONgcTwvFADCuyJFmRWaia5fNCXp+dXknjChBHIYSnzkiWjD4jEUK6LBGW8U8zu8oi7iJV4Vhvb1+y7WZJ4ThtUvXu0pWPBWxh8Scc5lBQZ5ZWaiqrshXiiX5HY1xX7vao2gd7GoNDzFeL6u25wa36OUupZlOR+Hl11GzzoZkiQ5VCozPoCvVkNZyAG7t8im85FcA8gr+su8fFbHR/MJJATPVgODJYDWcv5hfvIHvwT9IbQMIaqnHNLgLYiOzzgrRXPIXI7faKOHMLXGuPivkaZkJZc+tjwSpHUW17XQ+sN6w2i2c8GhkJimZFcXe5rcRVlxo2m0xmo2/UbPXYErpSS2lZNObodItsbrFKVmERF5iCVaaITFajrW4wmFr9QqtDrJQqNZJCS9hR5ZPIgjZbwogiJo3SUCjTyORVJWCz9bBv3ZE54xX6r8+1+T78OzykUEvfdU1N1/X1HW1qOtpXP+H1TtTDcSzPRH11q9XaWm1pdGR1Zll1FpvNorcJO7M35Q0/PL/19PDw6a3zDw/HU9cPDZ1oaTkxNHR9agQ2nyLD3so6e5bR1BQONdstWY29OJcWU4/RUeAY78pVUwGcybGHRegPO5lmlCw7n86ok/MHZZEtMJmyWFKTgZrJFoulZbImOur1jkajYz7fmHMuEFcrmxqjVchWplKV2R7DHQNcxwAe6A9NhUKT+B/8aEAWl0VpW3/1wsJDRTKpDBRJ5aEZckKby/jk/BnKnAnSwN42DhVSeOK/6NiuyIxhNrKbvbvu1p+Xx87G0QzaxD6JYuwDaIQ9hVTRKPtLgDyAL/DDE+gmsudKvsmh//SbnK3Fam2xcXeNw6FRO53oJmuzw45FsTuarT02vd5u1+ttFILo/Au0m9QplBRC55uWaS/6xW9/C1H6E9DyLXJu+Ptfx1H6+w14Fn0AWWgoU42AHB+MZioRmlqElkHSIgJcWF64FkdGRtCNaIL9BCvCd+gXAv8rJ7usGsABuvH9Zyc93qxtrF3/4Yc96F8tKvvhxEf3oXp7Oix0ecfhPEmNXxQaqMY8q6gtdIA+TnxdB9nLgtcalf+Fx+N1cBZcgswTWYPjgcB4kLvrQ5WVIT3804c+7z9Wg/THa47Dvxp27pj/+CncbSwQGMOdO/Vh3BUPCOuv9x+vOXas5jiq9B/zHT/uOwaasCydpm0CDWjCDe4D2jL+j87jCVuV+ETeHJzIszsi6oqOtoYhS80cOZE3l6UN2SLJ8mSsdwpO5A0Irv7gWCq8NXMsT6W26WVST4oJ91f7JhNCU0jttquq4FheTXsg0OckUeICHSJWEuHqR+qByhUu0X966n09Wshl70Ujuar0Qk3NQnr8KJx+b3a74mp13OXHp9+vR0dTqXtTqb9f+RA89jAT/nYPlKvwaoyLs1BoXTnIQsEBqUUjN9WEaHrHaIHYP17bMu4T7c2NVGnd5ZK8M59CtiC6ZUg9EsyW5qSMdcqaAXd1NyOy2yrcmuKQIdU5UzFFCfjTclheMVf/VsKFlk/ONaIXWB9cv+NO0N3Q2fnRri72V6tP0oFFgxRDV9BygoXgwFYNol+xvxyCUvpZ+KEkJzPepfP4OhvX09BITvq30FmIzYxGCiTwIVE32hFjb4nF4HESLcTZW9COOHtzjIJeccpIF9Ga5X2dylX7OoJVv8kZBqvaYFCvuth30RtGY4XSYFBWGNEC3MnbqYEBPJfbqdvobPRMZi5jOeBqR99gk+gbaLa//wf9/SBHA1VOS2gjJ2sl6CtL3oBOsrvQi+UTjysen3hhP7W2V2UldMvyZNES1otehI4ny1/Y/wLuC5TqgbCUDi+fJmewBUB72Ar16GX2T0NwiPXldHovOscGzg4OUgi4/DOdgx6jSonsRm6C6IjYCuKTeIGJjmqs5YVF4pzi0r6mkN5WUlIiKS7pa/pziUYhz6qu7poqV6kkLmfXFPlfEXGaQjFc2QFdrLfH2EfQZ+KPdi9B62a0G13gznrij37k9OYNe24YnS+ch5ZO9nNIxp4n3zfnaAEtw6eYFWs+bnq4yk+enmKYYN3UmCRp0fry4cs8+2Jjc3sd8i6e77YymgqoWrNgBr5Pd/C7dkaKAaofsnMnQAzK+pC2e8M9PeFId3dEqdMp4WpGD3Wyg4iAcFMGjLYO9G7s79/YO1Dn93j8+GLb8TJ0/T/AwT+UVCHE1bPAJdTL2bQnmwbx6AD7FnsRFaAC9lwfqobHxb0on32bnaNnFu+9fBSSI+RBAtAKHYA+b6N8S18funsv/rWXvUjbYAiMuZceQ0/SLy17IiNn4Lp3rmuOHpuDP6Dt96HHKP0i9CDt72+m4Sw6wN+ge9BR+kcYjqDoR/aBbTG65/hxam0bznpvxLYNkCZE3QctT8AXZBFpgfqBEd03snmko6Wwhe658cYp7CUfpzdCZvwZWT+BORku/jF4R6G2TRDPMqk1pnVxQRu9sTmsU6l04WYsyXfoKDpJs//Vl0qTz2fCV6FCUQgXHfWaqny+KpPXU1xIYMXAwUm6D30HOCjhOOD29nRcWF7hZrNMKxHLCiQKuob2mEt0hRuKcgulAnihN0ny83NLdbVhSUF+Trk+EsNa+TS9BfYyYceYm/OfRoX0ls5O3PJjuhUdpN+jpPCi47/6efiNylRSWrpBJi7PztYqGJuabpXrCwsKswRRwTqjUYPrjL8ubUablp7n9hAY+V+n7xkdxZjPLqnRg1QO1knWmt1QI9gls0/jqA7l+bMrSkrKyuxqfaO62qFy/8KmK5JLZYXSYk3AKmAMKgvWSwqyVh6tXt4rSaHtHeytYtq5+AqmdQJVoVfQdcvynUCNqArHO8T/L4nMOD360jDbKqZ/u1gKK1jeB8kpJOj9FLqE7lnlWfrJm1rQpd/+9vI2nY9B7l0tN0EbYFn2LDiVQAFW3h/gBDF+520KJ5XwO28NIfU+fuc1BedWyfsvYF09mVlXv0vH/wPMcuFfAAEAAAABs3UmXOD0Xw889QADA+gAAAAA5ViqVwAAAADmMzirAAb/IAJQA7AAAAAGAAIAAAAAAAB42mNgZGBgfvvvJgMDUwQD298zTAHMLxiQAVABAJk7BjAAAAB42pTLgUcDAQCF8StUTZgZRim4zbK2TjFnFam1ls6a1jIIRiQBCKFImARQ1SyhFARgf0WAgADCGQhDUfTFw3Cdhh8e3+tpG1O9FSPiB4MowZQSgqh4qMKEjYKHmNhqLWTF9BHApphYRAJxZDwMYwRJRMXCtI8g1jEvJjJ/yCKNLTg+djsUYcNEUdI+AshjBSlsYBU5WCh7SCKESaQ6FHCAQ1iwYYkJW10GKTnFA+7RwBFucY5HXOCyiy6GfvQh/M+fIS5acCUOV+bERRNFTGBb9lFFGA6uZE9OpIXjDu94Q06epI42QggiizwGEMEQavre4AvfmMUYEmrHEcUMHJSwgDUsy5J2BTso6zv6yzCMa3zgRepo4BlnuMMrPtGEgxp+BoxzoN4DQDgLqLaHYTFQ9gEAOhm0EQB42h3BA4DkMAAAwCRt2tTKbpG+bdu2bdu2bdu2bdu2bdt/MwCACEgNsoPCoDyoDZqDzqA/WACuQAFaMB3MCcvD2rA57Az7w6nwPHyDeGSiECVFGVF5VBv1QCPQcrQfneYAp3Iel5BLy+XginCDuWXcaZ7w2fh+/Hh+Lb+TP8pf5O/yH7CNU+H8uDRuiFfhrfgAPo2v4Yf4jVBaGCJsFvYJ38U8YjuxpzhEHC/OEreJv0l8kooUIKVJNdKQtCHdySAyh6wgB8hdyZfySMWlzlI/aaQ0RZovrZK2yrpcSO4rb5FvKfGVWkp3ZaayRFmv7FKOKteVz6qhplazqQXV6upc9bAGNKaV0SZoq7Unemq9iD5Zv6U/1t/oXw1oyIZjhEYiI7XRzGhndDP6GcOMccY0Y56xzFhnvDSRaZvxzfRmHbODudC8a36zkloNrZ7W/pinrFvWM+uTje14di67vb3EXmuftF86lhPXSe1kdwo75Z3aTi9nhnOGcjRCE9PUNButQOvSdrQ7HUTn0fX0AL1OX0TqRDZFzkazRcdHH7vUzeuWcqu6jdxu7hr3t1fSG+Yd9J54333Bj+2X8Gv77fxB/mz/iH/Zfx5oQY2gczA2mBesCnYER4PrwSfGWGFWgXVkfdkStpkdYOfZdfaUfWK/QhxqYSSMFSb+C6jyjjAAAHjaY2BkYGDkYAhlYGPwZWAF8pABMwMjABDVAL142oWQQ2JEURBFT2zbtq1JbHMate3unWQFmYWrygoyzh28WB+vTt26TwXkc0sKSalZ4uukSsNJNPNsOFmeJ8MpjPNoOPWDJ41qrgyn00jccL7884YLKaXfcBG5NIvFSYjLDdd80NvE2YbbRbCPDw9neFkjrOjGwQUnWBRt2KVtiS+VReRbQTohqY3SfXj1y6PXL3WaAb0+sUUVK6oTNitKkcNCv9Qgtg8rmXXo+7TTsThISJmqNDJEPxMMKr7TjFz7LLAp+m+9fbFN5NYdgz/eQ/TBv4DuQUJe0wfVhxnUPyo6lGJR/LjOrrw+nFIuUM4cEUW7NN1Deee3Ttk0Vw75zunnQk6P1Ci6uTILbuR526HvraP9ZmbXC3cZWo0AAAB42lzBQ3QdAABFwfti27b549S2bdu2Tm13U9u2bZ82xjp2sk32mcEIAJpPYABEK7IAQvgqIz4zmZtM4RYHCCWMqYRTSgTT+MI3vhNJFNHE8IOf/OI3sTImjngSSGQ6Bv7wlxn84yC3uUMSlSSTQipppPOfLGaSTQaZtKEt5bSjK7OYw1xmM595nKEb3VlAD8royUIWs4RF9KI3fehLDktZzgqZsIx+MpUZ/RnAQAaxksGsYg1rWc1Z1nGXIVQxlGEMZycjGMl6NrKJDYxiNGMYSwXPGMdJTuGMC6644Y4HnnjhjY/MZSFLWclaNrKVnezlIEc5yVkucpWb3OUhT3nxggYaaZK3fOQrP/krQIEKUjDGCsERe3zx4zomnCeIc7xnO7aY4UQHHLjHfTpjjQ3jmUh7OvKBjzzgIY94zFWu8YrXmGJFMJbsYBu72cUeNitUYUyghC28xFzhbOUYdlRTwxMCCMSfw0ziAp0UgYUiFaVoxShWcYpXghJlUJKSlaJUpSldGeyjC3vJpYg88ilWZktT5LITMQxD0Q3qEBh+pQp9s+wgVuwQP9A2ZhrRxihNWsTXI8eWYHVO7CtfVc360cMO99FZratel/pR2XzBaXl/ez3RtChb3ja8/QGPuXG43qIDlnDw5C7MHnimPjB6MbtLbrPfnNtgB8cK9joHDjorB7nDxdVTBwt1kEgHKXeQcQcZdSThDlbuIOUOMvq2QreaqPXlSVgIS9lXwlrYCFthx/leZ6t1MUC2wYTO3LxEj3KqPg3e4xG/VKLBw6VNqTthq65+2GHCdVTDFEMy2RXCRtirYBfzP1E9zIifw4h84WwwjLDg8RcpWmbZnZl1Pg0byKNLD/7Xl+dfBqMPtLgB/4WwBI0A",
    "base64",
  );
const appTile = readFileSync(join(process.cwd(), "public/og-appicon.png"));
const tileSrc = `data:image/png;base64,${appTile.toString("base64")}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0f0f",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "64px 64px 60px",
          position: "relative",
          width: "100%",
        }}
      >
        {/* faint lime grid, bleeding off the top-right edge */}
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,249,2,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(200,249,2,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            height: "760px",
            position: "absolute",
            right: "-80px",
            top: "-90px",
            transform: "rotate(-12deg)",
            width: "640px",
          }}
        />
        {/* lime top edge */}
        <div style={{ background: "#c8f902", height: "8px", left: 0, position: "absolute", top: 0, width: "100%" }} />

        <div style={{ display: "flex", flexDirection: "column", width: "680px" }}>
          {/* header: logo tile + wordmark */}
          <div style={{ alignItems: "center", display: "flex", gap: "16px" }}>
            <div
              style={{
                borderRadius: "15px",
                display: "flex",
                height: "62px",
                width: "62px",
              }}
            >
              <img src={tileSrc} style={{ height: "62px", width: "62px" }} />
            </div>
            <span
              style={{
                color: "#c8f902",
                fontFamily: "GeistMono",
                fontSize: "22px",
                letterSpacing: "0.22em",
              }}
            >
              POSTDIFF
            </span>
          </div>

          <div
            style={{
              color: "#9d9d9d",
              fontFamily: "GeistMono",
              fontSize: "15px",
              letterSpacing: "0.2em",
              marginTop: "66px",
            }}
          >
            BUILD IN PUBLIC / LOCAL-FIRST / COPY-ONLY
          </div>

          <div
            style={{
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              fontFamily: "Movatif",
              fontSize: "58px",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              marginTop: "22px",
            }}
          >
            <span>Turn commits into posts</span>
            <span>that sound like</span>
            <span style={{ color: "#c8f902" }}>you wrote them.</span>
          </div>

          <div
            style={{
              color: "#a1a1aa",
              display: "flex",
              fontSize: "21px",
              lineHeight: 1.4,
              marginTop: "26px",
            }}
          >
            The work worth sharing, drafted in your voice. Nothing posts itself.
          </div>
        </div>

        {/* right column: terminal card + floating logo tile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "flex-end",
            marginLeft: "20px",
            width: "360px",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              display: "flex",
              height: "150px",
              marginBottom: "6px",
              transform: "rotate(8deg)",
              width: "150px",
            }}
          >
            <img src={tileSrc} style={{ height: "150px", width: "150px" }} />
          </div>

          <div
            style={{
              background: "#0d0d0d",
              border: "1px solid #292929",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              height: "252px",
              justifyContent: "space-between",
              padding: "22px 24px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                fontFamily: "GeistMono",
                fontSize: "13px",
                gap: "8px",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
                <div
                  key={color}
                  style={{ background: color, borderRadius: "999px", height: "11px", width: "11px" }}
                />
              ))}
              <span style={{ color: "#686868", marginLeft: "6px" }}>postdiff / latest</span>
            </div>
            <div
              style={{
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                fontFamily: "GeistMono",
                fontSize: "16px",
                lineHeight: 1.75,
              }}
            >
              <div style={{ display: "flex" }}>
                <span style={{ color: "#c8f902", marginRight: "10px" }}>&gt;</span>
                <span>postdiff generate</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ color: "#686868", marginRight: "10px" }}>&gt;</span>
                <span style={{ color: "#9d9d9d" }}>drafting in your voice…</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#c8f902", marginRight: "10px" }}>&gt;</span>
                <span style={{ color: "#c8f902" }}>accept</span>
                <span style={{ color: "#686868", marginLeft: "10px" }}>· your voice, your call</span>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid #292929",
                color: "#686868",
                display: "flex",
                fontFamily: "GeistMono",
                fontSize: "12px",
                letterSpacing: "0.14em",
                paddingTop: "14px",
              }}
            >
              YOU APPROVE EVERY WORD
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Movatif", data: movatif, weight: 300, style: "normal" },
        { name: "GeistMono", data: geistMono, weight: 500, style: "normal" },
      ],
    },
  );
}
