import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fieldLabelPipes',
})
export class FieldLabelPipesPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
