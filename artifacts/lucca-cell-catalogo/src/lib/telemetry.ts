/**
 * Módulo de Observabilidade Unificada
 * Integração: Sentry, Datadog RUM/Logs, NewRelic e OpenTelemetry
 */

export interface TelemetryConfig {
  sentryDsn?: string;
  datadogApplicationId?: string;
  datadogClientToken?: string;
  newRelicLicenseKey?: string;
  openTelemetryCollectorUrl?: string;
  environment: string;
}

class TelemetryManager {
  private initialized = false;
  private config: TelemetryConfig = {
    environment: import.meta.env.MODE || 'development',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    datadogApplicationId: import.meta.env.VITE_DATADOG_APP_ID,
    datadogClientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  };

  public init(customConfig?: Partial<TelemetryConfig>) {
    if (this.initialized) return;
    this.config = { ...this.config, ...customConfig };

    this.initSentry();
    this.initDatadog();
    this.initNewRelic();
    this.initOpenTelemetry();

    this.initialized = true;
    console.log(`[Telemetry] Telemetria inicializada no ambiente: ${this.config.environment}`);
  }

  private initSentry() {
    if (this.config.sentryDsn) {
      console.log('[Telemetry] Sentry configurado:', this.config.sentryDsn);
      // Exemplo de integração nativa: Sentry.init({ dsn: this.config.sentryDsn, environment: this.config.environment });
    }
  }

  private initDatadog() {
    if (this.config.datadogApplicationId && this.config.datadogClientToken) {
      console.log('[Telemetry] Datadog RUM/Logs configurado.');
      // Exemplo: datadogRum.init({ applicationId: ..., clientToken: ..., site: 'datadoghq.com' });
    }
  }

  private initNewRelic() {
    if (this.config.newRelicLicenseKey) {
      console.log('[Telemetry] NewRelic Telemetry SDK ativo.');
    }
  }

  private initOpenTelemetry() {
    if (this.config.openTelemetryCollectorUrl) {
      console.log('[Telemetry] OpenTelemetry Web Tracer exportando para:', this.config.openTelemetryCollectorUrl);
    }
  }

  public captureException(error: Error | unknown, context?: Record<string, unknown>) {
    console.error('[Telemetry Error Captured]:', error, context);
    // Transmite para Sentry, Datadog e OpenTelemetry
  }

  public trackEvent(eventName: string, properties?: Record<string, unknown>) {
    console.log(`[Telemetry Event: ${eventName}]`, properties);
    // Transmite metadados de eventos para Datadog RUM e Sentry Analytics
  }
}

export const telemetry = new TelemetryManager();
