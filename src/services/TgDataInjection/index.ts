import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, RawSample, Signal } from '../../core/apis/DataInjection'

import { Telegraf } from 'telegraf'

@injectable()
export class TgDataInjection implements DataInjection {

  emit(signal: Signal, id: string): void {
    throw new Error('Method not implemented.')
  }

  listen(): Observable<RawSample> {

    const bot = new Telegraf('1667286177:AAEbRz5di9CqqwJcz8EDmyVAOTameSqqEtA')
    bot.start((ctx) => ctx.reply('Send us your location, pal'))
    bot.launch()

    return new Observable(subscriber => {
      bot.on('location', (ctx) => {
        subscriber.next({
          lat: ctx.message.location.latitude,
          lng: ctx.message.location.longitude,
          date: Date.now(),
          risk: 5,
          id: ctx.message.chat.id.toString()
        })
        ctx.reply('Location saved')
      }
      )
    })
  }
}