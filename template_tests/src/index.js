import {Queue} from '@nautoguide/ourthings';
import Templates from '@nautoguide/ourthings/Queueable/Templates';
import Elements from '@nautoguide/ourthings/Queueable/Elements';

window.queue = new Queue({
    templates: Templates,
    elements: Elements
});

memory['test'] = [];

for (let i = 0; i <= 100; i++) {
    memory['test'][i] = {
        'foo': i,
        'bar': -i,
        'value': i % 2 === 1,
        'array': [
            {
                'template': 'renderFoo'
            },
            {
                'template': 'renderBar'
            }
        ]
    }
}