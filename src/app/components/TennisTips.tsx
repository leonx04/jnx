import { faBaseballBall, faChartLine, faDumbbell, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const tips = [
  {
    icon: faBaseballBall,
    title: 'Kỹ thuật cơ bản',
    description: 'Học và thực hành các kỹ thuật cơ bản để xây dựng nền tảng vững chắc cho trò chơi của bạn.',
  },
  {
    icon: faChartLine,
    title: 'Chiến thuật thi đấu',
    description: 'Phát triển chiến thuật thông minh để giành lợi thế trong các trận đấu.',
  },
  {
    icon: faDumbbell,
    title: 'Thể lực và sức bền',
    description: 'Tăng cường thể lực và sức bền để duy trì hiệu suất cao trong suốt trận đấu.',
  },
  {
    icon: faShieldAlt,
    title: 'Phòng ngừa chấn thương',
    description: 'Học cách khởi động đúng cách và thực hiện các bài tập để ngăn ngừa chấn thương.',
  },
];

export default function TennisTips() {
  return (
    <section className="my-16">
      <div className="container-custom">
        <h2 className="text-3xl font-bold mb-8 text-center">Mẹo chơi tennis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tips.map((tip, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
              <FontAwesomeIcon icon={tip.icon} className="text-4xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
              <p className="text-gray-600">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

